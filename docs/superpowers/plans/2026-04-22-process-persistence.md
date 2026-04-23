# Full Process Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow terminal processes (PTYs) to persist across browser refreshes and WebSocket disconnections by introducing a server-side session registry.

**Architecture:** A singleton `SessionManager` will broker `sessionId -> PtyManager` relationships. `PtyManager` will maintain a small ring buffer of recent output to provide context upon re-attachment.

**Tech Stack:** Python, FastAPI, ptyprocess, React, Xterm.js

---

### Task 1: Enhance `PtyManager` with Output Buffering

**Files:**
- Modify: `backend/pty_manager.py`
- Test: `tests/backend/test_pty_buffer.py`

- [ ] **Step 1: Write a test for the ring buffer behavior**

```python
import pytest
from backend.pty_manager import PtyManager
import time

def test_pty_buffer_stores_output():
    pty = PtyManager(command="echo 'hello world'")
    pty.start()
    # Wait for output
    time.sleep(0.5)
    pty.read() # This should populate the buffer
    buffer = pty.get_buffer()
    assert b"hello world" in buffer
    pty.stop()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest tests/backend/test_pty_buffer.py`
Expected: FAIL (AttributeError: 'PtyManager' object has no attribute 'get_buffer')

- [ ] **Step 3: Implement ring buffer in `PtyManager`**

```python
import os
import shlex
import shutil
from collections import deque
from ptyprocess import PtyProcess

class PtyManager:
    def __init__(self, command: str = None, cwd: str = None):
        # ... existing init ...
        self.buffer = deque(maxlen=50)
        # ...
    
    def read(self, max_bytes: int = 1024) -> bytes:
        if not self.process:
            return b""
        try:
            data = self.process.read(max_bytes)
            if data:
                self.buffer.append(data)
            return data
        except EOFError:
            return b""

    def get_buffer(self) -> bytes:
        return b"".join(self.buffer)
    # ... rest of methods ...
```

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest tests/backend/test_pty_buffer.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/pty_manager.py
git commit -m "feat: add output buffering to PtyManager"
```

### Task 2: Create `SessionManager` Registry

**Files:**
- Create: `backend/session_manager.py`
- Test: `tests/backend/test_session_manager.py`

- [ ] **Step 1: Write test for session registry**

```python
from backend.session_manager import SessionManager
from backend.pty_manager import PtyManager

def test_session_manager_registration():
    sm = SessionManager()
    pty = PtyManager(command="bash")
    sm.register("test-session", pty)
    assert sm.get("test-session") == pty
    sm.unregister("test-session")
    assert sm.get("test-session") is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest tests/backend/test_session_manager.py`
Expected: FAIL (ModuleNotFoundError)

- [ ] **Step 3: Implement `SessionManager`**

```python
import time
from typing import Dict, Optional
from .pty_manager import PtyManager

class SessionManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SessionManager, cls).__new__(cls)
            cls._instance.sessions = {}
            cls._instance.last_activity = {}
        return cls._instance

    def register(self, session_id: str, pty: PtyManager):
        self.sessions[session_id] = pty
        self.last_activity[session_id] = time.time()

    def get(self, session_id: str) -> Optional[PtyManager]:
        if session_id in self.sessions:
            self.last_activity[session_id] = time.time()
            return self.sessions[session_id]
        return None

    def unregister(self, session_id: str):
        if session_id in self.sessions:
            pty = self.sessions.pop(session_id)
            self.last_activity.pop(session_id, None)
            if pty.is_alive():
                pty.stop()

    def prune_stale(self, max_age_seconds: int = 3600):
        now = time.time()
        to_remove = [
            sid for sid, last in self.last_activity.items()
            if now - last > max_age_seconds
        ]
        for sid in to_remove:
            self.unregister(sid)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest tests/backend/test_session_manager.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/session_manager.py
git commit -m "feat: add SessionManager for PTY registry"
```

### Task 3: Update WebSocket to use `SessionManager`

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Update `terminal_websocket` endpoint**

```python
from .session_manager import SessionManager

session_manager = SessionManager()

@app.websocket("/ws/terminal")
async def terminal_websocket(
    websocket: WebSocket, 
    sessionId: str = Query(...), # Require sessionId
    cwd: Optional[str] = Query(None),
    command: Optional[str] = Query("/bin/bash")
):
    await websocket.accept()
    
    pty = session_manager.get(sessionId)
    if not pty:
        print(f"DEBUG: Spawning new PTY for session {sessionId}")
        pty = PtyManager(cwd=cwd, command=command)
        try:
            pty.start()
            session_manager.register(sessionId, pty)
        except Exception as e:
            await websocket.send_text(f"\r\n[Overseer] Failed to start process: {e}\r\n")
            await websocket.close()
            return
    else:
        print(f"DEBUG: Re-attaching to PTY for session {sessionId}")
        # Send buffer to client immediately
        buffer = pty.get_buffer()
        if buffer:
            await websocket.send_text(buffer.decode(errors='replace'))

    # ... rest of the WebSocket logic remains similar but ensures 
    # it doesn't kill the PTY on disconnect unless we want it to.
```

- [ ] **Step 2: Update `ws_to_pty` to NOT stop PTY on disconnect**

```python
    async def ws_to_pty():
        try:
            while True:
                data = await websocket.receive_text()
                # ... existing logic ...
        except WebSocketDisconnect:
            print(f"DEBUG: WebSocket disconnected for session {sessionId}")
            # DO NOT STOP PTY HERE - let it persist
        except Exception as e:
            print(f"WS to PTY error: {e}")
            # Only stop on fatal errors? Or maybe still persist? 
            # For now, let's keep it persistent.
```

- [ ] **Step 3: Update `update_sessions` to prune killed tabs**

```python
@app.put("/api/sessions")
async def update_sessions(sessions: List[SessionTab]):
    # Get current session IDs
    old_ids = {s.id for s in store.config.sessions}
    new_ids = {s.id for s in sessions}
    
    # Find deleted tabs
    deleted_ids = old_ids - new_ids
    for sid in deleted_ids:
        print(f"DEBUG: Pruning deleted session {sid}")
        session_manager.unregister(sid)
        
    store.update_sessions(sessions)
    return {"status": "ok"}
```

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "feat: integrate SessionManager into WebSocket and API"
```

### Task 4: Frontend Updates

**Files:**
- Modify: `frontend/src/components/Terminal.tsx`

- [ ] **Step 1: Ensure `sessionId` is passed to WebSocket**

```typescript
// frontend/src/components/Terminal.tsx
// Add sessionId to the WebSocket URL
const wsUrl = `ws://${window.location.hostname}:8000/ws/terminal?sessionId=${sessionId}${cwd ? `&cwd=${encodeURIComponent(cwd)}` : ''}${command ? `&command=${encodeURIComponent(command)}` : ''}`;
```

- [ ] **Step 2: Verify terminal behavior**

1. Start Overseer.
2. Open a terminal, run `htop`.
3. Refresh page.
4. Terminal should immediately show `htop` exactly where it was.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Terminal.tsx
git commit -m "feat: pass sessionId to terminal WebSocket"
```
