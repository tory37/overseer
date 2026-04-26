# Overseer Native

The native Electron-based desktop application for Overseer. This version replaces the legacy Python/FastAPI + Browser architecture with a high-stability, local-first Command Center.

## Features

- **1:1 Terminal Fidelity:** Uses `node-pty` for native terminal sessions, eliminating rendering glitches.
- **Context Injection:** Automatically briefs AI CLIs (Gemini, Claude) using environment variables and synthesized briefing files.
- **Mascot & Voice Layer:** Dedicated UI frame for the Overseer mascot, with real-time `<voice>` tag parsing from terminal output.
- **Session Persistence:** Local JSON-based storage for your sessions and personas.

## Prerequisites

- **Node.js:** v18 or higher.
- **npm:** v9 or higher.
- **Gemini CLI / Claude CLI:** Installed and authenticated on your system.

## Getting Started

### 1. Install Dependencies

Navigate to the `native` directory and install the required packages:

```bash
cd native
npm install
```

### 2. Run in Development Mode

To start both the Electron main process and the React renderer with hot-reloading:

```bash
npm run dev
```

### 3. Build for Production

To compile the application for production:

```bash
npm run build
```

## Project Structure

- `src/main/`: Electron main process logic (PTY management, Store, Briefing Engine).
- `src/renderer/`: React frontend (Terminal, Sidebar, MascotFrame).
- `src/renderer/public/assets/`: Static assets like avatars.

## Environment Variables

Overseer Native injects the following variables into your terminal sessions:
- `OVERSEER_HUB=true`: Signals to CLI tools that they are running inside the Overseer environment.
- `OVERSEER_BRIEF`: Path to the synthesized Markdown brief for the current session.
- `GEMINI_SYSTEM_MD`: Pointed to the session brief for Gemini CLI.
- `CLAUDE_SYSTEM_PROMPT_FILE`: Pointed to the session brief for Claude CLI.
