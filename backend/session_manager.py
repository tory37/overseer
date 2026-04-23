import time
from typing import Dict, Optional
from backend.pty_manager import PtyManager

class SessionManager:
    _instance = None
    _sessions: Dict[str, Dict] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SessionManager, cls).__new__(cls)
        return cls._instance

    def register(self, session_id: str, pty: PtyManager):
        self._sessions[session_id] = {
            "pty": pty,
            "created_at": time.time(),
            "last_accessed": time.time()
        }

    def get(self, session_id: str) -> Optional[PtyManager]:
        session = self._sessions.get(session_id)
        if session:
            session["last_accessed"] = time.time()
            return session["pty"]
        return None

    def unregister(self, session_id: str):
        session = self._sessions.pop(session_id, None)
        if session:
            pty = session["pty"]
            if pty.is_alive():
                pty.stop()

    def prune_stale(self, max_age_seconds: int):
        now = time.time()
        stale_ids = [
            sid for sid, data in self._sessions.items()
            if now - data["last_accessed"] > max_age_seconds
        ]
        for sid in stale_ids:
            self.unregister(sid)
