# Session Persistence (tmux backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace in-process PTY ownership with tmux so terminal sessions survive backend restarts, and add an explicit delete button for sessions.

**Architecture:** Each session gets a named tmux session (`overseer-{uuid}`). The FastAPI backend wraps `tmux attach-session` with ptyprocess for I/O streaming, but the process itself lives in tmux. On backend restart, surviving tmux sessions are re-discovered and re-attached. Closing a tab kills the tmux session; browser refresh/server restart does not.

**Tech Stack:** Python 3.10+, FastAPI, ptyprocess, tmux, pytest, httpx, pytest-asyncio, React/TypeScript, Lucide icons

---

## File Map

| File | Change |
|---|---|
| `backend/pty_manager.py` | Full rewrite — tmux-backed, remove deque |
| `backend/session_manager.py` | Remove `append_to_buffer`, add `startup_discover`, update `create_session` and `subscribe` |
| `backend/store.py` | Add `delete_session` method |
| `backend/main.py` | Add startup event (tmux check + discovery), add `DELETE /api/sessions/{id}` |
| `backend/tests/__init__.py` | Create (empty, makes tests a package) |
| `backend/tests/test_pty_manager.py` | New — tests for tmux create/attach/buffer/stop |
| `backend/tests/test_session_manager.py` | New — tests for startup_discover |
| `backend/tests/test_delete_endpoint.py` | New — tests for DELETE endpoint |
| `frontend/src/utils/api.ts` | Add `deleteSession` function |
| `frontend/src/components/PersonaSidebar.tsx` | Add delete button to `SessionItem`, wire `onDeleteSession` |
| `frontend/src/components/PersonaLayout.tsx` | Add `onDeleteSession` prop, pass to sidebar |
| `frontend/src/App.tsx` | Add `handleDeleteSession`, pass to layout |

---

## Task 1: Install System and Dev Dependencies

**Files:**
- Modify: `pyproject.toml`
- Run: system package install

- [ ] **Step 1: Install tmux**

```bash
sudo apt install -y tmux
tmux -V
```
Expected output: `tmux 3.x.x` (any 3.x version)

- [ ] **Step 2: Install Python test dependencies**

```bash
pip install pytest httpx pytest-asyncio
```

- [ ] **Step 3: Add dev dependencies to pyproject.toml**

Open `pyproject.toml`. Add this block after `[build-system]`:

```toml
[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "httpx>=0.27.0",
    "pytest-asyncio>=0.23.0",
]
```

Also add at the end of the file:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["backend/tests"]
```

- [ ] **Step 4: Create the tests package init file**

Create `backend/tests/__init__.py` as an empty file.

- [ ] **Step 5: Commit**

```bash
git add pyproject.toml backend/tests/__init__.py
git commit -m "chore: add tmux + pytest dev dependencies"
```

---

## Task 2: Add `delete_session` to Store

**Files:**
- Modify: `backend/store.py:151-163`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_store.py`:

```python
import pytest
from backend.store import Store, SessionTab

def test_delete_session_removes_entry(tmp_path, monkeypatch):
    monkeypatch.setattr("backend.store.CONFIG_PATH", tmp_path / ".overseer.json")
    store = Store()
    tab = SessionTab(id="abc-123", name="test", cwd="/tmp")
    store.config.sessions = [tab]
    store.save()

    store.delete_session("abc-123")

    assert not any(s.id == "abc-123" for s in store.config.sessions)

def test_delete_session_nonexistent_is_noop(tmp_path, monkeypatch):
    monkeypatch.setattr("backend.store.CONFIG_PATH", tmp_path / ".overseer.json")
    store = Store()
    store.config.sessions = []
    store.save()
    store.delete_session("does-not-exist")  # should not raise
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest backend/tests/test_store.py -v
```
Expected: FAIL — `Store` has no attribute `delete_session`

- [ ] **Step 3: Add `delete_session` to Store**

In `backend/store.py`, add after `update_sessions` (line ~153):

```python
def delete_session(self, session_id: str):
    self.config.sessions = [s for s in self.config.sessions if s.id != session_id]
    self.save()
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pytest backend/tests/test_store.py -v
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/store.py backend/tests/test_store.py
git commit -m "feat: add Store.delete_session"
```

---

## Task 3: Rewrite PtyManager for tmux

**Files:**
- Rewrite: `backend/pty_manager.py`
- Create: `backend/tests/test_pty_manager.py`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_pty_manager.py`:

```python
import subprocess
import pytest
from backend.pty_manager import PtyManager

SESSION_ID = "test-pm-001"
TMUX_NAME = f"overseer-{SESSION_ID}"

def teardown_function():
    subprocess.run(["tmux", "kill-session", "-t", TMUX_NAME], capture_output=True)

def test_start_creates_tmux_session():
    pm = PtyManager(session_id=SESSION_ID, command="bash", cwd="/tmp")
    pm.start()
    result = subprocess.run(["tmux", "has-session", "-t", TMUX_NAME], capture_output=True)
    pm.stop()
    assert result.returncode == 0

def test_stop_kills_tmux_session():
    pm = PtyManager(session_id=SESSION_ID, command="bash", cwd="/tmp")
    pm.start()
    pm.stop()
    result = subprocess.run(["tmux", "has-session", "-t", TMUX_NAME], capture_output=True)
    assert result.returncode != 0

def test_get_buffer_returns_bytes():
    pm = PtyManager(session_id=SESSION_ID, command="bash", cwd="/tmp")
    pm.start()
    buf = pm.get_buffer()
    pm.stop()
    assert isinstance(buf, bytes)

def test_attach_connects_to_existing_session():
    subprocess.run(
        ["tmux", "new-session", "-d", "-s", TMUX_NAME, "-x", "80", "-y", "24", "bash"],
        check=True,
    )
    pm = PtyManager(session_id=SESSION_ID)
    pm.attach()
    assert pm.is_alive()
    pm.stop()

def test_is_alive_false_before_start():
    pm = PtyManager(session_id=SESSION_ID)
    assert not pm.is_alive()
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest backend/tests/test_pty_manager.py -v
```
Expected: FAIL — `PtyManager.__init__` does not accept `session_id`

- [ ] **Step 3: Rewrite `backend/pty_manager.py`**

Replace the entire file with:

```python
import os
import shlex
import shutil
import subprocess
import logging
import time
from ptyprocess import PtyProcess

logger = logging.getLogger(__name__)

class PtyManager:
    _TMUX_PREFIX = "overseer"

    def __init__(
        self,
        session_id: str,
        command: str = None,
        cwd: str = None,
        env: dict = None,
        rows: int = 24,
        cols: int = 80,
    ):
        shell_executable = shutil.which(os.environ.get("SHELL", "bash")) or "/bin/bash"

        if not command or command in ["/bin/bash", "/bin/zsh", "bash", "zsh"]:
            self._shell_cmd = None
        else:
            command_str = shlex.join(command) if isinstance(command, list) else command
            self._shell_cmd = [shell_executable, "-ic", command_str]

        self.session_id = session_id
        self.tmux_name = f"{self._TMUX_PREFIX}-{session_id}"
        self.cwd = cwd or os.getcwd()
        self.env = env or {}
        self.rows = rows
        self.cols = cols
        self.process: PtyProcess | None = None

    def start(self):
        logger.info(f"PtyManager: Creating tmux session {self.tmux_name}")
        cmd = [
            "tmux", "new-session", "-d",
            "-s", self.tmux_name,
            "-x", str(self.cols),
            "-y", str(self.rows),
        ]
        for key, val in self.env.items():
            cmd += ["-e", f"{key}={val}"]
        if self._shell_cmd:
            cmd += self._shell_cmd

        result = subprocess.run(cmd, cwd=self.cwd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"tmux new-session failed: {result.stderr.strip()}")
        self._attach_pty()

    def attach(self):
        """Attach to an existing tmux session (after server restart)."""
        logger.info(f"PtyManager: Attaching to existing tmux session {self.tmux_name}")
        self._attach_pty()

    def _attach_pty(self):
        self.process = PtyProcess.spawn(
            ["tmux", "attach-session", "-t", self.tmux_name],
            dimensions=(self.rows, self.cols),
        )
        time.sleep(0.1)
        if not self.process.isalive():
            logger.warning(f"PtyManager: tmux attach for {self.tmux_name} died immediately")

    def get_buffer(self) -> bytes:
        result = subprocess.run(
            ["tmux", "capture-pane", "-t", self.tmux_name, "-p", "-S", "-5000", "-e"],
            capture_output=True,
        )
        return result.stdout

    def read_raw(self, max_bytes: int = 1024) -> bytes:
        if not self.process:
            return b""
        try:
            return self.process.read(max_bytes)
        except (EOFError, Exception):
            return b""

    def write(self, data: str):
        if self.process:
            self.process.write(data.encode())

    def resize(self, rows: int, cols: int):
        self.rows = rows
        self.cols = cols
        if self.process:
            self.process.setwinsize(rows, cols)

    def is_alive(self) -> bool:
        if self.process:
            return self.process.isalive()
        return False

    def stop(self):
        logger.info(f"PtyManager: Killing tmux session {self.tmux_name}")
        subprocess.run(
            ["tmux", "kill-session", "-t", self.tmux_name],
            capture_output=True,
        )
        if self.process and self.process.isalive():
            try:
                self.process.terminate(force=True)
                self.process.wait()
            except Exception:
                pass
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pytest backend/tests/test_pty_manager.py -v
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add backend/pty_manager.py backend/tests/test_pty_manager.py
git commit -m "feat: rewrite PtyManager to use tmux as process owner"
```

---

## Task 4: Update SessionManager

**Files:**
- Modify: `backend/session_manager.py`
- Create: `backend/tests/test_session_manager.py`

Three changes in `session_manager.py`:
1. `_read_loop` — remove `self.pty.append_to_buffer(data)` call
2. `subscribe` — move `get_buffer()` outside lock (it's now a subprocess call)
3. `create_session` — pass `session_id` to PtyManager, use `extra_env` instead of full env copy
4. `startup_discover` — new method

- [ ] **Step 1: Write failing test for startup_discover**

Create `backend/tests/test_session_manager.py`:

```python
import subprocess
import pytest
from backend.session_manager import SessionManager
from backend.store import SessionTab

DISCOVER_ID = "test-discover-001"
TMUX_NAME = f"overseer-{DISCOVER_ID}"

def teardown_function():
    subprocess.run(["tmux", "kill-session", "-t", TMUX_NAME], capture_output=True)
    SessionManager._sessions.pop(DISCOVER_ID, None)

@pytest.mark.asyncio
async def test_startup_discover_reattaches_surviving_session():
    subprocess.run(
        ["tmux", "new-session", "-d", "-s", TMUX_NAME, "-x", "80", "-y", "24", "bash"],
        check=True,
    )
    stored = [SessionTab(id=DISCOVER_ID, name="Test", cwd="/tmp")]
    sm = SessionManager()
    await sm.startup_discover(stored)
    assert sm.get_session(DISCOVER_ID) is not None

@pytest.mark.asyncio
async def test_startup_discover_ignores_unknown_tmux_sessions():
    unknown_name = "overseer-not-in-store-99"
    subprocess.run(
        ["tmux", "new-session", "-d", "-s", unknown_name, "-x", "80", "-y", "24", "bash"],
        check=True,
    )
    stored = []  # nothing in store
    sm = SessionManager()
    before = set(sm._sessions.keys())
    await sm.startup_discover(stored)
    after = set(sm._sessions.keys())
    subprocess.run(["tmux", "kill-session", "-t", unknown_name], capture_output=True)
    assert after == before  # no new sessions registered
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest backend/tests/test_session_manager.py -v
```
Expected: FAIL — `SessionManager` has no `startup_discover`

- [ ] **Step 3: Update `_read_loop` — remove `append_to_buffer`**

In `backend/session_manager.py`, find `_read_loop` (lines ~34-72). Replace the inner block:

Old block (lines ~41-56):
```python
                async with self.lock:
                    logger.debug(f"Session {self.session_id} read {len(data)} bytes from PTY.")
                    # Atomic update: buffer + broadcast
                    self.pty.append_to_buffer(data)
                    
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
```

New block:
```python
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
```

- [ ] **Step 4: Update `subscribe` — move buffer fetch outside lock**

Replace the `subscribe` method (lines ~74-80):

Old:
```python
    async def subscribe(self) -> tuple[bytes, asyncio.Queue]:
        async with self.lock:
            buffer = self.pty.get_buffer()
            q = asyncio.Queue()
            self.queues.add(q)
            self.last_accessed = time.time()
            return buffer, q
```

New:
```python
    async def subscribe(self) -> tuple[bytes, asyncio.Queue]:
        buffer = await asyncio.to_thread(self.pty.get_buffer)
        async with self.lock:
            q = asyncio.Queue()
            self.queues.add(q)
            self.last_accessed = time.time()
        return buffer, q
```

- [ ] **Step 5: Update `create_session` — pass session_id to PtyManager and use extra_env**

Replace the `create_session` method (lines ~106-144). The key changes: pass `session_id` to `PtyManager`, and only inject the persona env var (not a full env copy):

```python
    async def create_session(self, name: str, cwd: str, persona: Optional[Persona] = None, command: Optional[str] = None, session_id: Optional[str] = None, rows: int = 24, cols: int = 80):
        if session_id is None:
            session_id = str(uuid.uuid4())

        extra_env = {}
        if persona:
            instructions = (
                f"Your name is {persona.name}. Your title is {persona.title}. {persona.instructions} "
                "CRITICAL: ALL conversational speech, greetings, 'flair', personality interjections, or explanations MUST be wrapped in <voice> tags. "
                "The ONLY things that should be OUTSIDE of <voice> tags are raw terminal commands, code, file paths, tree structures, or command logs. "
                "Examples: "
                "- '<voice>Hello! I am ready to help.</voice>' "
                "- '<voice>I will now search the codebase for that bug.</voice>' "
                "- 'grep -r \"bug\" src/' "
                "- '<voice>Found it! It was in the parser.</voice>' "
                "NEVER send plain text greetings or explanations without <voice> tags. If you are speaking to the user, use <voice>."
            )
            temp_path = f"/tmp/overseer_persona_{session_id}.md"
            try:
                with open(temp_path, "w") as f:
                    f.write(instructions)
                extra_env["GEMINI_SYSTEM_MD"] = temp_path
                logger.info(f"Created persona instructions at {temp_path}")
            except Exception as e:
                logger.error(f"Failed to create temporary persona file: {e}")

        pty = PtyManager(session_id=session_id, cwd=cwd, env=extra_env, command=command, rows=rows, cols=cols)
        pty.start()

        metadata = SessionMetadata(
            id=session_id,
            name=name,
            cwd=cwd,
            personaId=persona.id if persona else None
        )

        self.register(session_id, pty, metadata)
        return session_id
```

- [ ] **Step 6: Add `startup_discover` method**

Add this method to `SessionManager`, after `create_session`:

```python
    async def startup_discover(self, stored_sessions):
        """Re-attach to tmux sessions that survived a backend restart."""
        import subprocess as _sp
        try:
            result = _sp.run(
                ["tmux", "list-sessions", "-F", "#{session_name}"],
                capture_output=True,
                text=True,
            )
            if result.returncode != 0:
                logger.info("No tmux server running — nothing to rediscover")
                return

            stored_map = {s.id: s for s in stored_sessions}
            for name in result.stdout.strip().splitlines():
                if not name.startswith("overseer-"):
                    continue
                session_id = name[len("overseer-"):]
                if session_id not in stored_map or session_id in self._sessions:
                    continue

                stored = stored_map[session_id]
                logger.info(f"Rediscovering session {session_id} ({stored.name}) from tmux")
                pty = PtyManager(session_id=session_id)
                pty.attach()
                metadata = SessionMetadata(
                    id=session_id,
                    name=stored.name,
                    cwd=stored.cwd or "",
                    personaId=stored.personaId,
                )
                self.register(session_id, pty, metadata)
        except Exception as e:
            logger.error(f"Startup discovery failed: {e}", exc_info=True)
```

- [ ] **Step 7: Run tests to verify pass**

```bash
pytest backend/tests/test_session_manager.py -v
```
Expected: all PASS

- [ ] **Step 8: Commit**

```bash
git add backend/session_manager.py backend/tests/test_session_manager.py
git commit -m "feat: update SessionManager for tmux — startup discovery, remove deque buffer"
```

---

## Task 5: Startup Check and DELETE Endpoint in main.py

**Files:**
- Modify: `backend/main.py`
- Create: `backend/tests/test_delete_endpoint.py`

- [ ] **Step 1: Write failing test for DELETE endpoint**

Create `backend/tests/test_delete_endpoint.py`:

```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.main import app, store, session_manager
from backend.store import SessionTab

client = TestClient(app)

def test_delete_session_returns_200():
    tab = SessionTab(id="del-test-001", name="Test", cwd="/tmp")
    store.config.sessions = [tab]

    mock_session = MagicMock()
    session_manager._sessions["del-test-001"] = mock_session

    response = client.delete("/api/sessions/del-test-001")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert "del-test-001" not in session_manager._sessions
    assert not any(s.id == "del-test-001" for s in store.config.sessions)

def test_delete_session_returns_404_when_not_found():
    store.config.sessions = []
    session_manager._sessions.pop("nonexistent-id", None)

    response = client.delete("/api/sessions/nonexistent-id")

    assert response.status_code == 404
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest backend/tests/test_delete_endpoint.py -v
```
Expected: FAIL — no `DELETE /api/sessions/{session_id}` route

- [ ] **Step 3: Add startup event and DELETE endpoint to `backend/main.py`**

Add `import shutil` at the top of main.py (after existing imports), then add the startup event and DELETE route.

After the existing imports block (line ~16), add:
```python
import shutil
```

After the `app.add_middleware(...)` block (around line ~41), add:

```python
@app.on_event("startup")
async def on_startup():
    if not shutil.which("tmux"):
        logger.error(
            "tmux is required but not found. "
            "Install with: sudo apt install tmux"
        )
        raise SystemExit(1)
    stored_sessions = store.config.sessions
    await session_manager.startup_discover(stored_sessions)
```

After the existing `PUT /api/sessions` endpoint (around line ~110), add:

```python
@app.delete("/api/sessions/{session_id}")
async def delete_session_endpoint(session_id: str):
    stored = next((s for s in store.config.sessions if s.id == session_id), None)
    if not stored and not session_manager.get_session(session_id):
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    session_manager.unregister(session_id)
    store.delete_session(session_id)
    return {"status": "ok"}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pytest backend/tests/test_delete_endpoint.py -v
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add backend/main.py backend/tests/test_delete_endpoint.py
git commit -m "feat: add startup tmux check, session rediscovery, and DELETE /api/sessions/{id}"
```

---

## Task 6: Frontend — `deleteSession` API Function

**Files:**
- Modify: `frontend/src/utils/api.ts`

- [ ] **Step 1: Add `deleteSession` to api.ts**

In `frontend/src/utils/api.ts`, add after `deletePersona` (line ~129):

```typescript
export const deleteSession = async (id: string): Promise<void> => {
  const response = await fetch(`${getBaseUrl()}/api/sessions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Error deleting session: ${response.statusText}`);
  }
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/utils/api.ts
git commit -m "feat: add deleteSession API function"
```

---

## Task 7: Frontend — Delete Button in Sidebar and Wiring

**Files:**
- Modify: `frontend/src/components/PersonaSidebar.tsx`
- Modify: `frontend/src/components/PersonaLayout.tsx`
- Modify: `frontend/src/App.tsx`

The delete button appears on each session row in the sidebar, visible on hover. Clicking it calls `DELETE /api/sessions/{id}` then removes the tab from state.

- [ ] **Step 1: Update `SessionItem` in PersonaSidebar.tsx**

In `frontend/src/components/PersonaSidebar.tsx`, add `Trash2` to the import:

```typescript
import { Ghost, Search, Settings, Terminal, Folder, Plus, Trash2 } from 'lucide-react';
```

Replace the `SessionItem` component (lines 18-25):

```typescript
export const SessionItem = ({
  title,
  isActive,
  onClick,
  onDelete,
}: {
  title: string;
  isActive: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}) => (
  <div
    className={`group cursor-pointer px-2 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between gap-1 ${
      isActive ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
    }`}
  >
    <span onClick={onClick} className="flex-1 truncate min-w-0">{title}</span>
    {onDelete && (
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-all"
        title="Delete session"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    )}
  </div>
);
```

- [ ] **Step 2: Update `PersonaGroup` to accept and pass `onDeleteSession`**

Replace the `PersonaGroup` component and its props interface (lines ~27-65):

```typescript
const PersonaGroup = ({
  name,
  avatarConfig,
  sessions,
  selectedSessionId,
  onSelectSession,
  onDeleteSession,
}: {
  name: string;
  avatarConfig: AvatarConfig;
  sessions: SessionData[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="text-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left font-bold text-slate-400 py-1.5 px-2 hover:text-white flex items-center gap-1 rounded-md hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-[10px]">{expanded ? '▼' : '▶'}</span>
        <AgentAvatar avatarConfig={avatarConfig} state="idle" size={32} />
        <span className="ml-1">{name}</span>
      </button>
      {expanded && (
        <div className="pl-5 mt-1 space-y-0.5 border-l border-slate-800 ml-4">
          {sessions.map(session => (
            <SessionItem
              key={session.id}
              title={session.name}
              isActive={session.id === selectedSessionId}
              onClick={() => onSelectSession(session.id)}
              onDelete={onDeleteSession ? () => onDeleteSession(session.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Update `PersonaSidebarProps` and wire `onDeleteSession` through**

Replace the `PersonaSidebarProps` interface (lines ~67-76):

```typescript
interface PersonaSidebarProps {
  sessions: SessionData[];
  personas: Persona[];
  selectedSessionId: string | null;
  specialView: SpecialView | null;
  onSelectSession: (id: string) => void;
  onOpenSpecialView: (type: SpecialView) => void;
  onNewSession: () => void;
  onDeleteSession?: (id: string) => void;
}
```

In the `PersonaSidebar` function destructuring, add `onDeleteSession`:
```typescript
export const PersonaSidebar: React.FC<PersonaSidebarProps> = ({
  sessions,
  personas,
  selectedSessionId,
  specialView,
  onSelectSession,
  onOpenSpecialView,
  onNewSession,
  onDeleteSession,
}) => {
```

Find where `PersonaGroup` is rendered (around line ~113-120, inside the sessions map) and add `onDeleteSession`:

```typescript
<PersonaGroup
  key={persona.id}
  name={persona.name || persona.title}
  avatarConfig={persona.avatarConfig ?? DEFAULT_AVATAR_CONFIG}
  sessions={personaSessions}
  selectedSessionId={selectedSessionId}
  onSelectSession={onSelectSession}
  onDeleteSession={onDeleteSession}
/>
```

Also find where ungrouped sessions are rendered as bare `SessionItem` elements and add `onDelete` there:
```typescript
<SessionItem
  key={session.id}
  title={session.name}
  isActive={session.id === selectedSessionId}
  onClick={() => onSelectSession(session.id)}
  onDelete={onDeleteSession ? () => onDeleteSession(session.id) : undefined}
/>
```

- [ ] **Step 4: Update `PersonaLayout.tsx` — add `onDeleteSession` prop**

In `frontend/src/components/PersonaLayout.tsx`, update the interface:

```typescript
interface PersonaLayoutProps {
  tabs: Tab[];
  personas: Persona[];
  onPersonaCreated: () => void;
  onNewSession: () => void;
  onCloseSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}
```

Add to destructuring:
```typescript
export const PersonaLayout: React.FC<PersonaLayoutProps> = ({
  tabs,
  personas,
  onPersonaCreated,
  onNewSession,
  onCloseSession,
  onDeleteSession,
}) => {
```

Pass it to `PersonaSidebar` in the JSX:
```typescript
<PersonaSidebar
  sessions={tabs as SessionData[]}
  personas={personas}
  selectedSessionId={selectedSessionId}
  specialView={specialView}
  onSelectSession={handleSelectSession}
  onOpenSpecialView={handleOpenSpecialView}
  onNewSession={onNewSession}
  onDeleteSession={onDeleteSession}
/>
```

- [ ] **Step 5: Update `App.tsx` — add `handleDeleteSession` and pass to layout**

In `frontend/src/App.tsx`, update the import to include `deleteSession`:

```typescript
import { getBaseUrl, createSession, deleteSession, type Persona, getPersonas } from './utils/api'
```

Add `handleDeleteSession` after `closeSession`:

```typescript
const handleDeleteSession = async (id: string) => {
  try {
    await deleteSession(id)
  } catch (err) {
    console.error('Failed to delete session from backend:', err)
  }
  setTabs(prev => prev.filter(t => t.id !== id))
}
```

Pass it to `PersonaLayout`:
```typescript
<PersonaLayout
  tabs={tabs}
  personas={personas}
  onPersonaCreated={() => getPersonas().then(setPersonas)}
  onNewSession={() => setIsCreatingSession(true)}
  onCloseSession={closeSession}
  onDeleteSession={handleDeleteSession}
/>
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 7: Smoke test in browser**

Start backend and frontend dev servers. Open a session. Hover over the session name in the sidebar — a small trash icon should appear on the right. Click it. The session should disappear from the list.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/PersonaSidebar.tsx frontend/src/components/PersonaLayout.tsx frontend/src/App.tsx
git commit -m "feat: add delete button to session sidebar items"
```

---

## Task 8: End-to-End Persistence Verification

Manual verification — no code changes.

- [ ] **Step 1: Start a long-running command**

Open a new session in the UI. In the terminal, run:
```bash
top
```

- [ ] **Step 2: Restart the backend**

Kill the FastAPI process (`ctrl+c`), then restart it:
```bash
python -m backend.main
```
(or however the project is normally started)

- [ ] **Step 3: Reload the browser**

Refresh the page. The terminal should reconnect and show `top` still running — no restart of the command.

- [ ] **Step 4: Verify delete kills the process**

Open a new session. Run `sleep 9999`. Click the trash icon in the sidebar for that session. Confirm the tab disappears. Run:
```bash
tmux list-sessions
```
The `overseer-{id}` entry for that session should be gone.

- [ ] **Step 5: Run full test suite**

```bash
pytest backend/tests/ -v
```
Expected: all tests pass

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete tmux session persistence and session deletion"
```
