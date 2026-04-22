# Repo Modal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the repository addition UI from a narrow sidebar component to a central, full-screen modal, incorporating a system-wide file browser for repository selection.

**Architecture:** The existing Python FastAPI backend will be extended with new endpoints for file system interaction. The React (TypeScript) frontend will implement new reusable components for the modal and file browser.

**Tech Stack:** React, TypeScript, FastAPI, `uv`.

---

### Task 1: Backend File System API

**Goal:** Create new FastAPI endpoints to enable listing directories and reading file/directory metadata for system-wide browsing, addressing the user's need to "browse the whole system".

**Files:**
- Create: `backend/file_system_api.py`
- Modify: `backend/main.py`
- Test: `tests/backend/test_file_system_api.py`

- [x] **Step 1: Write a failing test for listing directory contents**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `backend/file_system_api.py` with a directory listing function**
- [x] **Step 4: Add FastAPI endpoint to `backend/main.py` to expose directory listing**
- [x] **Step 5: Run test to verify it passes**
- [x] **Step 6: Write a failing test for handling non-existent paths or non-directories**
- [x] **Step 7: Run test to verify it fails (or passes if initial implementation already handles it)**
- [x] **Step 8: Implement robust error handling and path validation in `list_directory_contents`**
- [x] **Step 9: Run test to verify it passes**
- [x] **Step 10: Commit**

---

### Task 2: Frontend File Browser Component

**Goal:** Develop a reusable React component for navigating the file system, utilizing the new backend API.

**Files:**
- Create: `frontend/src/components/FileBrowser.tsx`
- Create: `frontend/src/components/FileBrowser.module.css` (for styling)
- Test: (This will be an integration test within a parent component later)

- [x] **Step 1: Create `FileBrowser.tsx` skeleton and basic UI**
- [x] **Step 2: Create `FileBrowser.module.css` for basic styling**
- [x] **Step 3: Temporarily integrate `FileBrowser` into `App.tsx` to verify functionality**
- [x] **Step 4: Run the frontend development server and verify the file browser works as expected**
- [x] **Step 5: Commit**

---

### Task 3: Modal Component Implementation

**Goal:** Create a generic, reusable React modal component that can display arbitrary content, fulfilling the user's requirement for a modal "that opens in the center of the screen".

**Files:**
- Create: `frontend/src/components/Modal.tsx`
- Create: `frontend/src/components/Modal.module.css` (for styling)
- Modify: `frontend/src/App.tsx` (temporarily for testing)

- [x] **Step 1: Create `Modal.tsx` skeleton and basic UI**
- [x] **Step 2: Create `Modal.module.css` for styling**
- [x] **Step 3: Temporarily integrate `Modal` into `App.tsx` to verify functionality**
- [x] **Step 4: Run the frontend development server and verify the modal opens and closes correctly, displaying its content.**
- [x] **Step 5: Commit**

---

### Task 4: Integrate File Browser into Modal for Repo Addition

**Goal:** Replace the existing sidebar-bound repo addition UI with the new generic Modal component containing the FileBrowser for selecting repository paths.

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/App.tsx` (remove temporary FileBrowser and Modal integration)

- [x] **Step 1: Refactor `Sidebar.tsx` to include state for modal visibility and selected path**
- [x] **Step 2: Remove temporary `FileBrowser` and `Modal` integration from `App.tsx`**
- [x] **Step 3: Run the frontend development server and verify the new workflow for adding a repository.**
- [x] **Step 4: Commit**

---

### Task 5: Refine Repo Addition Logic

**Goal:** Connect the modal's selected path to the backend's repository management API, and enhance the UI feedback.

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `backend/main.py` (assuming repo add endpoint is here)
- Modify: `backend/store.py` (if the repo add logic needs adjustment)

- [x] **Step 1: Update `Sidebar.tsx` to send selected path to backend API**
- [x] **Step 2: Ensure `backend/main.py` has a `POST /api/repos` endpoint and `GET /api/repos` endpoint for listing**
- [x] **Step 3: Update `backend/store.py` to handle `add_repository` and `get_repositories`**
- [x] **Step 4: Run the frontend and backend development servers, and verify repository addition works end-to-end.**
- [x] **Step 5: Commit**

---

### Task 6: Remove Old UI

**Goal:** Remove the previous, unsatisfactory UI elements related to adding repositories from the sidebar, ensuring a clean transition to the new modal-based approach.

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx` (remove any remnants of the old repo addition UI, if not already handled)
- Modify: `frontend/src/App.tsx` (ensure no old test components are present)

- [x] **Step 1: Review `Sidebar.tsx` and remove any legacy repo addition input fields or buttons.**
- [x] **Step 2: Review `App.tsx` to confirm all temporary `FileBrowser` and `Modal` test integrations are removed.**
- [x] **Step 3: Run the frontend development server and visually inspect that only the new "Add Repository" button and modal workflow are present.**
- [x] **Step 4: Commit**
