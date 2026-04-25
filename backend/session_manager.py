import time
import asyncio
import os
import subprocess
import uuid
import logging
from typing import Dict, List, Optional, Set
from pydantic import BaseModel
from backend.pty_manager import PtyManager
from backend.store import Persona, SessionTab

logger = logging.getLogger(__name__)

_TMUX_PREFIX = "overseer-"


class SessionMetadata(BaseModel):
    id: str
    name: str
    cwd: str
    personaId: Optional[str] = None
    selectedAgentId: Optional[str] = None


class Session:
    def __init__(self, session_id: str, pty: PtyManager, metadata: Optional[SessionMetadata] = None):
        self.session_id = session_id
        self.pty = pty
        self.metadata = metadata
        self.created_at = time.time()
        self.last_accessed = time.time()
        self.queues: Set[asyncio.Queue] = set()
        self._read_task: Optional[asyncio.Task] = None
        self.lock = asyncio.Lock()

    def start_reading(self):
        if self._read_task is None:
            self._read_task = asyncio.create_task(self._read_loop())

    async def _read_loop(self):
        logger.info(f"Session {self.session_id} _read_loop started.")
        try:
            while self.pty.is_alive():
                data = await asyncio.to_thread(self.pty.read_raw)
                if data:
                    async with self.lock:
                        logger.debug(f"Session {self.session_id} read {len(data)} bytes from PTY.")
                        disconnected_queues = []
                        for q in self.queues:
                            try:
                                q.put_nowait(data)
                            except asyncio.QueueFull:
                                logger.warning(f"Session {self.session_id} queue full for one client, dropping data.")
                                disconnected_queues.append(q)
                        for q in disconnected_queues:
                            self.queues.discard(q)
                else:
                    if not self.pty.is_alive():
                        logger.info(f"Session {self.session_id} PTY not alive (EOF), _read_loop exiting.")
                        break
                    await asyncio.sleep(0.01)
        except asyncio.CancelledError:
            logger.info(f"Session {self.session_id} _read_loop cancelled.")
        except Exception as e:
            logger.error(f"Session {self.session_id} read loop error: {e}", exc_info=True)
        finally:
            logger.info(f"Session {self.session_id} _read_loop exiting.")
            self._read_task = None

    async def subscribe(self) -> tuple[bytes, asyncio.Queue]:
        # get_buffer is a blocking subprocess call — fetch outside the async lock
        buffer = await asyncio.to_thread(self.pty.get_buffer)
        async with self.lock:
            q = asyncio.Queue()
            self.queues.add(q)
            self.last_accessed = time.time()
            return buffer, q

    def unsubscribe(self, q: asyncio.Queue):
        self.queues.discard(q)
        self.last_accessed = time.time()

    def stop(self):
        if self._read_task:
            self._read_task.cancel()
        self.pty.stop()


class SessionManager:
    _instance = None
    _sessions: Dict[str, Session] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SessionManager, cls).__new__(cls)
        return cls._instance

    def startup_discover(self, stored_sessions: List[SessionTab]):
        """Re-attach to tmux sessions that survived a backend restart."""
        try:
            result = subprocess.run(
                ["tmux", "list-sessions", "-F", "#{session_name}"],
                capture_output=True,
                text=True,
            )
            live_names = {
                line.strip()
                for line in result.stdout.splitlines()
                if line.strip().startswith(_TMUX_PREFIX)
            }
        except Exception as e:
            logger.warning(f"startup_discover: could not list tmux sessions: {e}")
            return

        stored_by_id = {s.id: s for s in stored_sessions}

        for name in live_names:
            session_id = name[len(_TMUX_PREFIX):]
            if session_id not in stored_by_id:
                continue
            stored = stored_by_id[session_id]
            logger.info(f"startup_discover: re-attaching session {session_id}")
            pty = PtyManager(session_id=session_id, command=stored.command, cwd=stored.cwd or "/tmp")
            pty.attach()
            metadata = SessionMetadata(
                id=session_id,
                name=stored.name,
                cwd=stored.cwd or "/tmp",
                personaId=stored.personaId,
                selectedAgentId=stored.selectedAgentId,
            )
            self.register(session_id, pty, metadata)

    def register(self, session_id: str, pty: PtyManager, metadata: Optional[SessionMetadata] = None):
        session = Session(session_id, pty, metadata)
        session.start_reading()
        self._sessions[session_id] = session

    async def create_session(
        self,
        name: str,
        cwd: str,
        persona: Optional[Persona] = None,
        command: Optional[str] = None,
        session_id: Optional[str] = None,
        rows: int = 24,
        cols: int = 80,
    ):
        if session_id is None:
            session_id = str(uuid.uuid4())

        from backend.store import Store
        store = Store()

        extra_env: dict = {}
        instructions = ""
        
        # 1. Persona (Voice and Tone)
        if persona:
            instructions += (
                f"# PERSONA: {persona.name} ({persona.title})\n{persona.instructions}\n\n"
                "CRITICAL VOICE CONSTRAINT: ALL conversational speech, greetings, 'flair', personality interjections, or explanations MUST be wrapped in <voice> tags. "
                "The ONLY things that should be OUTSIDE of <voice> tags are raw terminal commands, code, file paths, tree structures, or command logs. "
                "Examples: "
                "- '<voice>Hello! I am ready to help.</voice>' "
                "- '<voice>I will now search the codebase for that bug.</voice>' "
                "- 'grep -r \"bug\" src/' "
                "- '<voice>Found it! It was in the parser.</voice>' "
                "NEVER send plain text greetings or explanations without <voice> tags. If you are speaking to the user, use <voice>.\n"
            )

        # 2. Resource Libraries (Discovery Approach)
        skills_dir = store.config.skills_directory
        agents_dir = store.config.agents_directory
        
        instructions += "\n# RESOURCE LIBRARIES\n"
        instructions += "You have access to specialized libraries of instructions. Browse these directories using your file system tools to find specific guidance or adopt specialized workflows.\n"
        
        if skills_dir:
            abs_skills_dir = os.path.abspath(os.path.expanduser(skills_dir))
            extra_env["OVERSEER_SKILLS_DIR"] = abs_skills_dir
            instructions += f"- Technical Skills: {abs_skills_dir} (Expertise manuals)\n"
            
        if agents_dir:
            abs_agents_dir = os.path.abspath(os.path.expanduser(agents_dir))
            extra_env["OVERSEER_AGENTS_DIR"] = abs_agents_dir
            instructions += f"- Agent Roles: {abs_agents_dir} (Workflow definitions)\n"


        if instructions:
            temp_path = f"/tmp/overseer_persona_{session_id}.md"
            try:
                with open(temp_path, "w") as f:
                    f.write(instructions)
                extra_env["GEMINI_SYSTEM_MD"] = temp_path
                logger.info(f"Created synthesized system prompt at {temp_path}")
            except Exception as e:
                logger.error(f"Failed to create temporary persona file: {e}")

        pty = PtyManager(
            session_id=session_id,
            command=command,
            cwd=cwd,
            extra_env=extra_env,
            rows=rows,
            cols=cols,
        )
        pty.start()

        metadata = SessionMetadata(
            id=session_id,
            name=name,
            cwd=cwd,
            personaId=persona.id if persona else None,
            selectedAgentId=agent_id
        )
        self.register(session_id, pty, metadata)
        return session_id

    def get_session(self, session_id: str) -> Optional[Session]:
        return self._sessions.get(session_id)

    def unregister(self, session_id: str):
        session = self._sessions.pop(session_id, None)
        if session:
            session.stop()
            temp_path = f"/tmp/overseer_persona_{session_id}.md"
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception as e:
                    logger.error(f"Failed to delete temporary persona file {temp_path}: {e}")

    def clear(self):
        for sid in list(self._sessions.keys()):
            self.unregister(sid)
        self._sessions.clear()

    def prune_stale(self, max_age_seconds: int):
        now = time.time()
        stale_ids = [
            sid for sid, session in self._sessions.items()
            if not session.queues and (now - session.last_accessed > max_age_seconds)
        ]
        for sid in stale_ids:
            self.unregister(sid)
