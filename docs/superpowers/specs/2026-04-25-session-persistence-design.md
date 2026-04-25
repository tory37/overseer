# Design Spec: Full Process Persistence via tmux

**Date:** 2026-04-25
**Status:** Draft
**Topic:** Server-restart-proof session persistence and session deletion

## Goal

Terminal sessions (PTYs) should survive server restarts and browser disconnects seamlessly — as if the user never closed the terminal. Sessions are only destroyed when the user explicitly deletes them. A missing delete button is also addressed here.

## Architecture

Replace the current `ptyprocess`-owned PTY model with a tmux-backed model. tmux runs as an independent OS-level daemon that outlives the FastAPI process. Overseer becomes a thin manager that creates and attaches to tmux sessions rather than owning processes directly.

### Before
```
Frontend WS → FastAPI → PtyManager (ptyprocess) → bash/claude
```

### After
```
Frontend WS → FastAPI → PtyManager (tmux attach) → tmux server → bash/claude
```

### Session Lifecycle Rules

| Event | Action |
|---|---|
| User opens new tab | `tmux new-session` creates a named session |
| User closes/deletes tab | `tmux kill-session` destroys the process |
| Backend restarts | tmux sessions survive; backend re-attaches on next connect |
| Browser refresh / crash | WebSocket disconnects; tmux session keeps running |

### Naming Convention

tmux session names: `overseer-{uuid}` — namespaced to avoid colliding with the user's own tmux sessions. UUIDs with hyphens are valid tmux session names.

### Dependency Requirement

tmux must be installed on the host. On FastAPI startup, detect via `shutil.which("tmux")` and exit with a clear install message if missing.

---

## Backend Components

### 1. `PtyManager` Changes (`backend/pty_manager.py`)

**`start(command, cwd, cols, rows, env)`**
- Step 1: `tmux new-session -d -s overseer-{id} -x {cols} -y {rows} -e KEY=VAL... {command}` — creates the session detached; tmux owns the process.
- Step 2: `PtyProcess.spawn(["tmux", "attach-session", "-t", "overseer-{id}"])` — wraps an attach so the existing read loop and resize calls work unchanged.
- Persona env var (`GEMINI_SYSTEM_MD`) injected in Step 1 via `-e`.

**`attach()`** (new method)
- Called when a session already exists in tmux but has no live ptyprocess (after a backend restart).
- Runs Step 2 only — skips `tmux new-session`.

**`stop()`**
- Runs `subprocess.run(["tmux", "kill-session", "-t", f"overseer-{self.id}"])` before closing the ptyprocess.
- Only called on explicit user deletion. Disconnecting does NOT call `stop()`.

**`get_buffer()`**
- Replaces the `deque(maxlen=50)` with:
  ```
  tmux capture-pane -t overseer-{id} -p -S -5000 -e
  ```
- Returns last 5000 lines with ANSI codes as bytes. The `deque` field is removed.

### 2. `SessionManager` Changes (`backend/session_manager.py`)

**`__init__()`**
- After initializing the in-memory registry, runs startup discovery:
  1. `tmux list-sessions -F '#{session_name}'` — get all tmux sessions.
  2. Filter for `overseer-` prefix, extract UUIDs.
  3. Cross-reference against sessions in `~/.overseer.json`.
  4. For each match, call `pty.attach()` and register without spawning a new process.
- Sessions in tmux with no store entry: ignored.
- Sessions in the store with no tmux entry: left as-is; `create_session()` is called on next WebSocket connect.

**`unregister(session_id)`**
- Calls `pty.stop()` (kills the tmux session) then removes from the in-memory registry.

### 3. WebSocket Handler Changes (`backend/main.py`)

**On connect:**
1. Check `session_manager.get_session(session_id)`.
2. If found: call `get_buffer()` and write the full bytes payload before entering the read loop (buffer replay).
3. If not found and `cwd` provided: call `create_session()`.

**On disconnect:**
- Detach the ptyprocess attach without calling `stop()`. The tmux session keeps running.

### 4. New REST Endpoint

**`DELETE /api/sessions/{session_id}`**
- Calls `session_manager.unregister(session_id)`.
- Removes the session entry from the store (`~/.overseer.json`).
- Returns 200 on success, 404 if not found.

---

## Frontend Components

### 1. Session Deletion UI (`frontend/src/App.tsx` + `frontend/src/components/TabContainer.tsx`)

- Add a trash/delete icon button to each tab, visually distinct from the close (×) button.
- Clicking delete calls `DELETE /api/sessions/{session_id}`.
- On 200 response, remove the tab from React state.
- On error, show a brief inline error message.

**Behavioral distinction:**
- Close (×) — closes the tab in the UI and kills the process (current behavior, unchanged).
- Delete (trash) — explicitly destroys the session and all history; cannot be undone.

*Note:* If close (×) and delete are the same action, they can be unified into one button with a confirmation dialog instead. The endpoint behavior is the same either way.

### 2. Buffer Replay (`frontend/src/components/Terminal.tsx`)

- No changes needed. The buffer payload from `tmux capture-pane` is raw bytes with ANSI codes — Xterm.js handles it identically to live output.

---

## Constraints

- **Scope:** Persistence survives backend restarts. Machine reboots destroy tmux sessions (out of scope).
- **OS:** Linux. tmux must be installed (`apt install tmux`).
- **Scrollback:** 5000 lines via `tmux capture-pane`. Configurable in the future via tmux's `history-limit`.
- **No new file formats:** Session metadata continues to live in `~/.overseer.json` via the existing store.

---

## Success Criteria

1. Start a long-running command (e.g., `top`, `claude`, a build).
2. Restart the FastAPI backend (`ctrl+c`, `python main.py`).
3. Reload the browser.
4. Terminal reconnects and shows current process state — the command was never interrupted.
5. Clicking the delete button kills the process and removes the tab.
6. Closing the tab (×) also kills the process (existing behavior preserved).
