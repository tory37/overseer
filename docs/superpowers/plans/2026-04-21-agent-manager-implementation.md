# Agent Manager (Overseer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a "uvx-ready" Python-based web UI for managing multiple Gemini CLI instances and repositories with task isolation.

**Architecture:** Python (FastAPI) backend serving a React (TypeScript) frontend. Backend manages PTYs via `pypty` and automates `git worktree` for isolation.

**Tech Stack:** Python, FastAPI, React, xterm.js, uv, tailwindcss (for quick, clean UI).

---

### Task 1: Project Scaffolding & Python Environment

**Files:**
- Create: `pyproject.toml`
- Create: `backend/main.py`
- Create: `backend/__init__.py`

- [x] **Step 1: Create `pyproject.toml` with `uv` configuration**
- [x] **Step 2: Create a minimal FastAPI server in `backend/main.py`**
- [x] **Step 3: Verify the server runs**
- [x] **Step 4: Commit**

---

### Task 2: Frontend Setup (React + xterm.js)

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/components/Terminal.tsx`

- [x] **Step 1: Initialize Vite React (TS) app in `frontend/`**
- [x] **Step 2: Build a basic Terminal component wrapper for `xterm.js`**
- [x] **Step 3: Update `App.tsx` to show a sidebar and a main terminal area**
- [x] **Step 4: Commit**

---

### Task 3: PTY Backend (The "Engine")

**Files:**
- Create: `backend/pty_manager.py`
- Modify: `backend/main.py`

- [x] **Step 1: Implement `PtyManager` class in `backend/pty_manager.py`**
- [x] **Step 2: Create WebSocket endpoint in `backend/main.py` for terminal traffic**
- [x] **Step 3: Connect Frontend Terminal to WebSocket**
- [x] **Step 4: Commit**

---

### Task 4: Repository & Folder Management

**Files:**
- Create: `backend/store.py`
- Modify: `backend/main.py`
- Modify: `frontend/src/components/Sidebar.tsx`

- [x] **Step 1: Implement JSON storage in `backend/store.py`**
- [x] **Step 2: Create CRUD API endpoints for repositories and folders**
- [x] **Step 3: Build the Sidebar UI to interact with these endpoints**
- [x] **Step 4: Commit**

---

### Task 5: Task Isolation (Git Worktrees)

**Files:**
- Create: `backend/git_utils.py`
- Modify: `backend/api/tabs.py`

- [x] **Step 1: Implement `git_utils.py` to handle worktree logic**
- [x] **Step 2: Create "Start Task" logic**
- [x] **Step 3: Update Terminal to launch in the worktree directory**
- [x] **Step 4: Commit**

---

### Task 6: Split-Pane & Utility Views

**Files:**
- Create: `frontend/src/components/UtilityPane.tsx`
- Modify: `frontend/src/components/TabContainer.tsx`

- [x] **Step 1: Implement the Split-Pane layout in the Tab view**
- [x] **Step 2: Add "Shell" and "Git" modes to the Utility Pane**
- [x] **Step 3: Implement Tab switching and naming**
- [x] **Step 4: Commit**

---

### Task 7: Packaging for `uvx`

**Files:**
- Modify: `pyproject.toml`
- Create: `backend/scripts/build_frontend.py`

- [ ] **Step 1: Add build script to compile React and move assets to `backend/static`**
  Ensure FastAPI is configured to serve these static files.

- [ ] **Step 2: Define entry point in `pyproject.toml`**
  `agent-manager = "backend.main:run"`

- [ ] **Step 3: Verify "Production" run**
  Run: `uv run agent-manager` (should work without a separate frontend server).

- [ ] **Step 4: Commit**
  `git add . && git commit -m "chore: package for uvx distribution"`
