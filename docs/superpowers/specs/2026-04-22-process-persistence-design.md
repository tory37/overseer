# Design Spec: Full Process Persistence (PTY Re-attachment)

**Date:** 2026-04-22
**Status:** Draft
**Topic:** Process Persistence for Terminal Sessions

## Goal
Implement a mechanism where terminal processes (PTYs) outlive browser refreshes and WebSocket disconnections, allowing users to re-attach to running agents or long-running commands.

## Architecture
Overseer will move from a "Connection-Scoped PTY" model to a "Session-Scoped PTY" model managed by a central registry.

### Backend Components

#### 1. `PtyManager` Enhancements
- **Output Buffer:** Use `collections.deque(maxlen=50)` to store the most recent output lines.
- **Buffer Persistence:** The buffer will store raw bytes to ensure ANSI escape codes are preserved for terminal rendering upon re-attachment.

#### 2. `SessionManager` (New)
- **Registry:** A dictionary mapping `session_id` (UUID) to `PtyManager` instances.
- **Activity Tracking:** Track the `last_connected` timestamp for each PTY.
- **Lifecycle Methods:**
    - `get_session(session_id)`: Retrieve an existing PTY or return None.
    - `create_session(session_id, command, cwd)`: Initialize and start a new PTY.
    - `prune_sessions()`: Terminate PTYs that have been inactive for >1 hour.

#### 3. API & WebSocket Changes
- **WebSocket `/ws/terminal`**:
    - Accepts a `sessionId` query parameter.
    - If `sessionId` exists in `SessionManager`, "attach" to the existing PTY and immediately stream the buffer.
    - If `sessionId` is new, create a new PTY.
- **Session Cleanup (`PUT /api/sessions`)**:
    - When the frontend syncs the tab list, any `sessionId` present in the registry but *missing* from the new tab list will be terminated and removed.

### Frontend Components

#### 1. `Terminal.tsx`
- Ensure the `sessionId` (the tab's ID) is passed to the WebSocket on every connection attempt.
- Handle the incoming "buffer" data seamlessly (Xterm.js will handle the ANSI sequence playback).

## Success Criteria
1. Start a long-running command (e.g., `top` or a build).
2. Refresh the browser.
3. Upon reload, the terminal should immediately show the current state of the process without it being restarted.
4. Closing a tab in the UI should successfully kill the underlying PTY process.

## Constraints
- **Scope:** Persistence is limited to the lifetime of the Overseer backend process. If the server restarts, all PTYs are lost.
- **OS:** Linux (relying on `ptyprocess`).
