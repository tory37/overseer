# Design Spec: Overseer Native Command Center (Pivot)

## 1. Vision & Goals
Overseer is a native "Command Center" designed to wrap AI terminal workflows in a stable, organized, and fun environment. It solves the "finicky" nature of browser-based emulators by moving to a native architecture, while providing a unified control plane for managing AI personas, skills, and agents across different providers (Claude, Gemini, etc.).

### Key Success Criteria:
- **1:1 Terminal Fidelity:** Zero rendering glitches, instant input, and perfect resizing (matching the stability of VS Code).
- **Unified Ecosystem:** A shared library of Skills and Agents that "just works" across any supported AI CLI.
- **Agent Cockpit UX:** A sidebar-centric interface for managing dozens of named, sorted, and archived sessions.
- **Persona Layer:** A lightweight "flair" that separates AI dialogue from terminal output.

## 2. Architecture: Native Wrapper
We are pivoting from a Browser/Python/Tmux stack to a **Local-First Electron Application**.

### The Stack:
- **Frontend:** React + `xterm.js` (running in the Electron renderer process).
- **Shell Engine:** `node-pty` (running in the Electron main process). This forks real shell processes and communicates with the frontend via IPC (Inter-Process Communication).
- **Persistence:** **SQLite** or a local JSON store to manage session metadata, persona definitions, and global configurations.
- **OS:** Linux (primary target), with portability to macOS/Windows via Electron.

## 3. Core Features

### 3.1 Session Management (The Navigator)
The sidebar is the heart of the app, replacing browser tabs with a "Navigator" view.
- **Named Sessions:** Every terminal session has a custom name and project association.
- **Virtual Persistence:** Closing the app terminates the shell process, but the "Session" remains in the sidebar. Clicking it again launches a fresh shell and "briefs" the AI to resume where it left off.
- **Archiving:** Move old sessions to an "Archive" list. They are read-only logs of the previous terminal state, keeping the "Live" list clean.

### 3.2 Ecosystem Orchestration (The Briefing)
The Hub manages a global library of Skills and Agents. When a session starts, it "briefs" the AI CLI using **Context Injection**.
- **The Briefing:** A synthesized markdown file containing Persona instructions and the absolute paths to the Skill/Agent library.
- **The Injection:** The Hub uses "Adapters" to launch the CLI:
    - **Claude:** Injects via `CLAUDE_CONFIG_DIR` or system prompt flags.
    - **Gemini:** Injects via `GEMINI_SYSTEM_MD`.
    - **Generic:** Uses shell aliases to wrap the AI call with the overseer brief.
- **Integration Instruction:** The AI is explicitly told it is in the "Overseer Hub" and given instructions on how to search/write to the shared library.

### 3.3 Persona Framework
The "Fun" layer is decoupled from the terminal output.
- **Voice Parsing:** The app monitors the terminal stream for `<voice>` tags.
- **Dialogue UI:** Text within `<voice>` tags is extracted and displayed in a clean "speech bubble" or dialogue box next to the Pixel Art mascot.
- **Mascot Perch:** The character sits in a dedicated frame, maintaining its state (idle/thinking/speaking) regardless of terminal scrolling.

## 4. Technical Strategy

### 4.1 Terminal Stability
By using `node-pty` directly in the Electron main process, we eliminate the network latency and protocol overhead of WebSockets and Tmux. The data flow is:
`Shell Process <-> node-pty (Main) <-> Electron IPC <-> xterm.js (Renderer)`.

### 4.2 Local Configuration Sync
The Hub maintains a "Source of Truth" configuration. Before launching any shell, it checks for updates in the Skill library and ensures the environment variables for the target AI are correctly mapped.

## 5. Implementation Phases (High-Level)
1. **Scaffold Electron:** Setup a basic Electron + React + node-pty environment.
2. **Terminal View:** Implement the Xterm.js renderer with perfect resizing and 1:1 fidelity.
3. **Session Sidebar:** Build the metadata storage and the sidebar navigation.
4. **The Briefing Engine:** Implement the "Context Synthesis" and CLI adapters (starting with Claude and Gemini).
5. **Persona Layer:** Add the mascot frame and the `<voice>` tag parser.
