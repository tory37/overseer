# Overseer

**The Control Plane for Agentic Engineering.**

Overseer is a unified, native desktop "Command Center" for managing AI CLI workflows (Gemini, Claude, Cursor). It transforms the experience of working with AI agents from juggling terminal windows into a managed, high-visibility workspace with 1:1 terminal fidelity.

## Why Overseer Native?

We've pivoted from a browser-based emulator to a native Electron application to solve the "Terminal Sprawl" and rendering issues inherent in web-based PTY implementations.

- **1:1 Terminal Fidelity:** Native `node-pty` integration ensures your terminal looks and behaves exactly like your local shell.
- **Context Injection:** Automatically briefs your agents on startup via environment variables.
- **Managed Isolation:** Every task can be managed in a dedicated workspace.
- **Persistent Sessions:** Sessions, CWD, and Persona metadata persist across application restarts.
- **Mascot Interaction:** A dedicated UI frame extracts `<voice>` tags from your agent's stream to give them a distinct personality.

## Getting Started (Native)

The new native application is located in the `native/` directory.

### Prerequisites

- **Node.js:** v18 or higher.
- **npm:** v9 or higher.
- **Gemini CLI / Claude CLI:** Installed and configured in your environment.

### Run Locally

```bash
cd native
npm install
npm run dev
```

For more detailed instructions, see the [Native README](./native/README.md).

---

## Legacy Architecture (Python/FastAPI)

The legacy version (FastAPI backend + React frontend) is still available in the `backend/` and `frontend/` directories but is no longer the primary focus of development.

### Running Legacy Version via `uvx`

```bash
# Run locally from the current directory
uvx --from . overseer
```

---

*Note: Overseer is currently in active development. Ensure your AI CLIs are correctly authenticated before starting sessions.*
