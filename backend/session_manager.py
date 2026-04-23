import time
import asyncio
from typing import Dict, Optional, Set
from backend.pty_manager import PtyManager

class Session:
    def __init__(self, session_id: str, pty: PtyManager):
        self.session_id = session_id
        self.pty = pty
        self.created_at = time.time()
        self.last_accessed = time.time()
        self.queues: Set[asyncio.Queue] = set()
        self._read_task: Optional[asyncio.Task] = None

    def start_reading(self):
        if self._read_task is None:
            self._read_task = asyncio.create_task(self._read_loop())

    async def _read_loop(self):
        try:
            while self.pty.is_alive():
                # read() in PtyManager already updates its internal buffer
                data = await asyncio.to_thread(self.pty.read)
                if data:
                    # Broadcast to all connected clients
                    disconnected_queues = []
                    for q in self.queues:
                        try:
                            q.put_nowait(data)
                        except asyncio.QueueFull:
                            # If a queue is full, the client is probably slow/dead
                            disconnected_queues.append(q)
                    
                    for q in disconnected_queues:
                        self.queues.discard(q)
                else:
                    await asyncio.sleep(0.01)
        except Exception as e:
            print(f"Session {self.session_id} read loop error: {e}")
        finally:
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

    def register(self, session_id: str, pty: PtyManager):
        session = Session(session_id, pty)
        session.start_reading()
        self._sessions[session_id] = session

    def get_session(self, session_id: str) -> Optional[Session]:
        return self._sessions.get(session_id)

    def unregister(self, session_id: str):
        session = self._sessions.pop(session_id, None)
        if session:
            session.stop()

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
