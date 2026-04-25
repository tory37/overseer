# Overseer

**The Control Plane for Agentic Engineering.**

Overseer is a unified UI and orchestration layer for managing multiple [Gemini CLI](https://github.com/google/gemini-cli) agent instances. It transforms the experience of working with AI agents from juggling terminal windows into a managed, high-visibility workspace.

## Why Overseer?

Working with AI agents often leads to "Terminal Sprawl" and constant context switching. Overseer solves this by providing:

- **Managed Isolation:** Every task automatically spins up in a dedicated `git worktree`. No more `git stash` or manual branch management when switching between agent tasks.
- **The Command Center:** A purpose-built IDE-like interface with split-panes for your agent's terminal, a raw shell for manual intervention, and real-time project status.
- **Persistent Sessions:** Sessions survive backend restarts. Pick up exactly where you (or the agent) left off.
- **Persona Studio (Optional):** Define distinct AI personalities (e.g., "Architect," "Reviewer," "Bug Hunter") with custom avatars and system prompts to specialize your agent workforce.

## Getting Started

### Prerequisites

- **Python:** 3.10 or higher.
- **Gemini CLI:** Installed and configured in your environment.
- **Git:** Required for task isolation (worktrees).

### Installation & Run

The fastest way to run Overseer is via `uvx`:

```bash
# Run locally from the current directory
uvx --from . overseer

# Run from a remote repository (once published)
uvx --from git+https://github.com/USER/overseer overseer
```

Overseer will start a local server (default: `http://127.0.0.1:8000`) and handle all PTY and session management locally for maximum security and speed.

## Core Features

### 🛠 Git-Backed Task Isolation
When you start a new task in Overseer, it doesn't just open a terminal. It creates a dedicated directory using `git worktree`. This ensures that the agent's changes are isolated from your main working directory until you are ready to review and merge them.

### 🖥 The Unified Terminal
Overseer uses `xterm.js` to provide a full-featured terminal experience. The UI is designed to keep the Agent's output front-and-center while providing quick-access tabs for secondary shells and file browsing.

### 👤 Persona System
While Overseer is a productivity-first tool, it includes a robust Persona system. You can assign avatars (powered by DiceBear) and custom prompts to different agents, helping you visually distinguish between different concurrent workstreams.

## Architecture

Overseer is built with a modern, lightweight stack:
- **Backend:** FastAPI (Python) handles PTY processes, WebSocket communication, and session persistence.
- **Frontend:** React + TypeScript + Tailwind CSS for a responsive, high-performance dashboard.
- **Communication:** Real-time bidirectional streaming via WebSockets for low-latency terminal interaction.

---

*Note: Overseer is currently in early development. Ensure your Gemini CLI is correctly authenticated before starting sessions.*
