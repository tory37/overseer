# Overseer

**The Control Plane for Agentic Engineering.**

Overseer is a unified UI and orchestration layer for managing multiple [Gemini CLI](https://github.com/google/gemini-cli) agent instances. It transforms the experience of working with AI agents from juggling terminal windows into a managed, high-visibility workspace.

## Why Overseer?

Working with AI agents often leads to "Terminal Sprawl" and constant context switching. Overseer solves this by providing:

- **Managed Isolation:** Every task automatically spins up in a dedicated `git worktree`. No more `git stash` or manual branch management when switching between agent tasks.
- **The Command Center:** A purpose-built IDE-like interface with split-panes for your agent's terminal, a raw shell for manual intervention, and real-time project status.
- **Persistent Sessions:** Sessions survive backend restarts. Pick up exactly where you (or the agent) left off.
- **Skill System:** Decouple agent personality from their technical capabilities. Create a library of reusable technical instructions (e.g., "TDD", "Git Management", "React Expert") and mix-and-match them with any persona.
- **Persona Studio:** Define distinct AI personalities (e.g., "Architect," "Reviewer," "Bug Hunter") with custom avatars and system prompts to focus on their voice and tone.

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

### Running on a Custom Port

You can customize the host and port using command-line arguments:

```bash
uvx --from . overseer --port 8080 --host 0.0.0.0
```

This is particularly useful if you want to run a stable version while developing locally on the default port.

## Core Features

### 🛠 Git-Backed Task Isolation
When you start a new task in Overseer, it doesn't just open a terminal. It creates a dedicated directory using `git worktree`. This ensures that the agent's changes are isolated from your main working directory until you are ready to review and merge them.

### 🖥 The Unified Terminal
Overseer uses `xterm.js` to provide a full-featured terminal experience. The UI is designed to keep the Agent's output front-and-center while providing quick-access tabs for secondary shells and file browsing.

### 🧩 Plugin-Based Skill System
The Skill System allows you to build a repository of "Technical Skills" as Markdown files. 
When starting a new session, you can select which skills your agent should have. Overseer automatically synthesizes these skills into the agent's system prompt. 
Skills can be organized into folders and shared via git, making your agent's technical knowledge portable and version-controlled.

### 👤 Persona System
While Overseer is a productivity-first tool, it includes a robust Persona system. You can assign avatars (powered by DiceBear) and custom prompts to different agents. In the new architecture, Personas handle the "Voice and Tone," while Skills handle the "Technical Expertise."

## Architecture

Overseer is built with a modern, lightweight stack:
- **Backend:** FastAPI (Python) handles PTY processes, WebSocket communication, and session persistence.
- **Frontend:** React + TypeScript + Tailwind CSS for a responsive, high-performance dashboard.
- **Communication:** Real-time bidirectional streaming via WebSockets for low-latency terminal interaction.

---

*Note: Overseer is currently in early development. Ensure your Gemini CLI is correctly authenticated before starting sessions.*
