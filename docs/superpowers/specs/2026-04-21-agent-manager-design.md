# Agent Manager (Overseer) Design Specification

**Date:** 2026-04-21
**Status:** Draft (Pending User Review)
**Topic:** Unified UI for managing multiple Gemini CLI agent instances and repositories.

## 1. Overview
The Agent Manager is a desktop-style web application designed to provide a "command center" for developers working with multiple Gemini CLI agents across various repositories. It focuses on seamless repository organization, task-based isolation using Git worktrees, and integrated utility tools for project state visibility.

## 2. Core Architecture
- **Frontend:** React (TypeScript) SPA.
  - **Layout:** IDE-like workspace with a sidebar for organization and a tabbed main area for agent instances.
  - **Terminal:** `xterm.js` for high-performance terminal emulation.
- **Backend:** Python (FastAPI).
  - **Process Management:** Uses `pypty` or similar to manage PTYs for Gemini CLI and shell instances.
  - **Storage:** Simple JSON-based persistence at `~/.agent-manager.json`.
  - **Worktree Management:** Automates `git worktree` via shell commands.
  - **Distribution:** Packaged as a Python project to support `uvx` (e.g., `uvx --from git+... agent-manager`). The backend serves the pre-built React frontend assets.

## 3. Key Features

### 3.1 Repository Organization
- **Free-form Hierarchy:** Users can create arbitrary nested folders to group repositories (e.g., by client, project type, or status).
- **Drag-and-Drop:** Seamlessly move repositories between groups.
- **Search:** Global search to quickly find and launch repositories.

### 3.2 Task-Based Isolation (Tabs)
- **Multi-Instance Support:** Ability to open multiple independent "tabs" for a single repository.
- **Managed Worktrees:**
  - Option to start a "New Task" which creates a managed `git worktree` in a cache directory (`~/.agent-manager/worktrees/`).
  - Ensures isolation between parallel branches/tickets without cluttering the main project directory.
- **Lifecycle Management:** Start, stop, and restart agent processes per tab. Tabs persist their metadata (name, path, branch) even when the process is stopped.

### 3.3 Integrated Workspace (Split-Pane View)
Each tab features a split-pane layout:
- **Agent Pane (Left):** Dedicated terminal running the Gemini CLI.
- **Utility Pane (Right):** Toggleable view with three modes:
  - **Raw Shell:** A standard bash/zsh terminal synced to the tab's current directory.
  - **Git Dashboard:** A visual interface for diffs, staging, and commits.
  - **Project Inspector:** A high-level status view showing branch info, modified files, and an AI-summarized project state.

## 4. Technical Constraints & Success Criteria
- **Performance:** Terminals must be responsive and support all standard CLI interactive features.
- **Robustness:** Gracefully handle process crashes and ensure worktrees are cleaned up upon explicit tab deletion.
- **Portability:** Primarily designed for local Linux/macOS environments where Gemini CLI is installed.

## 5. Future Considerations
- Support for remote/SSH-based agent management.
- Integration with external task managers (GitHub Issues, Jira).
- Custom toolbelt for injecting project-specific shortcuts into the UI.
