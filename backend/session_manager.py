import time
import asyncio
import os
import uuid
import logging
from typing import Dict, Optional, Set
from pydantic import BaseModel
from backend.pty_manager import PtyManager
from backend.store import Persona

logger = logging.getLogger(__name__)

class SessionMetadata(BaseModel):
    id: str
    name: str
    cwd: str
    personaId: Optional[str] = None

class Session:
    def __init__(self, session_id: str, pty: PtyManager, metadata: Optional[SessionMetadata] = None):
        self.session_id = session_id
        self.pty = pty
        self.metadata = metadata
        self.created_at = time.time()
        self.last_accessed = time.time()
        self.queues: Set[asyncio.Queue] = set()
        self._read_task: Optional[asyncio.Task] = None

    def start_reading(self):
        if self._read_task is None:
            self._read_task = asyncio.create_task(self._read_loop())

    async def _read_loop(self):
        logger.info(f"Session {self.session_id} _read_loop started.")
        try:
            while self.pty.is_alive():
                # read() in PtyManager already updates its internal buffer
                data = await asyncio.to_thread(self.pty.read)
                if data:
                    logger.debug(f"Session {self.session_id} read {len(data)} bytes from PTY.")
                    # Broadcast to all connected clients
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
                    # Data is empty, check if PTY is still alive
                    if not self.pty.is_alive():
                        logger.info(f"Session {self.session_id} PTY not alive (EOF), _read_loop exiting.")
                        break # PTY process has died
                    await asyncio.sleep(0.01) # Small sleep to prevent busy-waiting if PTY is silent
            
            if not self.pty.is_alive():
                logger.info(f"Session {self.session_id} PTY exited with status {getattr(self.pty.process, 'exitstatus', 'unknown')}")
        except asyncio.CancelledError:
            logger.info(f"Session {self.session_id} _read_loop cancelled.")
        except Exception as e:
            logger.error(f"Session {self.session_id} read loop error: {e}", exc_info=True)
        finally:
            logger.info(f"Session {self.session_id} _read_loop exiting.")
            self._read_task = None

    def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self.queues.add(q)
        self.last_accessed = time.time()
        return q

    def unsubscribe(self, q: asyncio.Queue):
        self.queues.discard(q)
        self.last_accessed = time.time()

    def stop(self):
        if self._read_task:
            self._read_task.cancel()
        if self.pty.is_alive():
            self.pty.stop()

class SessionManager:
    _instance = None
    _sessions: Dict[str, Session] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SessionManager, cls).__new__(cls)
        return cls._instance

    def register(self, session_id: str, pty: PtyManager, metadata: Optional[SessionMetadata] = None):
        session = Session(session_id, pty, metadata)
        session.start_reading()
        self._sessions[session_id] = session

    async def create_session(self, name: str, cwd: str, persona: Optional[Persona] = None, command: Optional[str] = None, session_id: Optional[str] = None):
        if session_id is None:
            session_id = str(uuid.uuid4())
        env = os.environ.copy()
        if persona:
            instructions = (
                f"You are {persona.name}. {persona.instructions} "
                "You MUST wrap all non-technical conversational chatter in <voice> tags. "
                "Do not wrap code, commands, or technical output in these tags."
            )
            # Gemini CLI expects GEMINI_SYSTEM_MD to point to a file path, not the text directly.
            # We'll write to a temporary file.
            temp_path = f"/tmp/overseer_persona_{session_id}.md"
            try:
                with open(temp_path, "w") as f:
                    f.write(instructions)
                env["GEMINI_SYSTEM_MD"] = temp_path
                logger.info(f"Created persona instructions at {temp_path}")
            except Exception as e:
                logger.error(f"Failed to create temporary persona file: {e}")
            
        # Use command if provided, otherwise default to interactive shell
        pty = PtyManager(cwd=cwd, env=env, command=command)
        pty.start()
        
        metadata = SessionMetadata(
            id=session_id,
            name=name,
            cwd=cwd,
            personaId=persona.id if persona else None
        )
        
        self.register(session_id, pty, metadata)
        return session_id

    def get_session(self, session_id: str) -> Optional[Session]:
        return self._sessions.get(session_id)

    def unregister(self, session_id: str):
        session = self._sessions.pop(session_id, None)
        if session:
            session.stop()
            # Clean up temporary persona file if it exists
            temp_path = f"/tmp/overseer_persona_{session_id}.md"
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    logger.info(f"Cleaned up temporary persona file at {temp_path}")
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
