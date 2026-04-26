# Overseer Native Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot Overseer from a browser-based emulator to a stable, native Electron desktop app with integrated terminal (node-pty) and "Context Injection" for AI CLIs.

**Architecture:** Electron-based local-first app. The Main process manages native PTY sessions and persistence (SQLite/JSON), while the Renderer process handles the Xterm.js terminal and the "Agent Cockpit" UI.

**Tech Stack:** Electron, React, TypeScript, node-pty, xterm.js, SQLite (via Better-SQLite3 or JSON store).

---

### Task 1: Project Scaffolding

**Files:**
- Create: `native/package.json`
- Create: `native/tsconfig.json`
- Create: `native/src/main/main.ts`
- Create: `native/src/renderer/index.html`
- Create: `native/src/renderer/index.tsx`

- [ ] **Step 1: Initialize the native directory and package.json**

```json
{
  "name": "overseer-native",
  "version": "0.1.0",
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:renderer\" \"npm run dev:main\"",
    "dev:renderer": "vite src/renderer",
    "dev:main": "tsc -w -p tsconfig.main.json & electron .",
    "build": "tsc -p tsconfig.main.json && vite build src/renderer"
  },
  "dependencies": {
    "electron-is-dev": "^2.0.0",
    "node-pty": "^1.0.0",
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "concurrently": "^8.2.0"
  }
}
```

- [ ] **Step 2: Create basic Electron main process**

```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in initial pivot
    },
  });

  const url = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../renderer/index.html')}`;
  
  win.loadURL(url);
}

app.whenReady().then(createWindow);
```

- [ ] **Step 3: Commit**

```bash
git add native/
git commit -m "chore: scaffold native electron project"
```

---

### Task 2: Native PTY Integration (Main Process)

**Files:**
- Create: `native/src/main/pty-manager.ts`
- Modify: `native/src/main/main.ts`

- [ ] **Step 1: Implement PTY Manager**

```typescript
import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';

export class PtyManager {
  private sessions: Map<string, pty.IPty> = new Map();

  createSession(id: string, shell: string, cwd: string, window: BrowserWindow) {
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: cwd,
      env: process.env as any
    });

    ptyProcess.onData((data) => {
      window.webContents.send(`pty-data-${id}`, data);
    });

    this.sessions.set(id, ptyProcess);
    return ptyProcess;
  }

  write(id: string, data: string) {
    this.sessions.get(id)?.write(data);
  }

  resize(id: string, cols: number, rows: number) {
    this.sessions.get(id)?.resize(cols, rows);
  }
}
```

- [ ] **Step 2: Connect IPC in main.ts**

```typescript
const ptyManager = new PtyManager();

ipcMain.on('pty-create', (event, { id, shell, cwd }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) ptyManager.createSession(id, shell, cwd, win);
});

ipcMain.on('pty-write', (event, { id, data }) => {
  ptyManager.write(id, data);
});
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: implement native pty manager"
```

---

### Task 3: Terminal View (Renderer Process)

**Files:**
- Create: `native/src/renderer/components/Terminal.tsx`
- Create: `native/src/renderer/hooks/useTerminal.ts`

- [ ] **Step 1: Create Xterm.js Component**

```tsx
import React, { useEffect, useRef } from 'react';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
const { ipcRenderer } = window.require('electron');

export const Terminal: React.FC<{ id: string }> = ({ id }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Xterm>();

  useEffect(() => {
    const term = new Xterm({ theme: { background: '#1a1b26' } });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    if (terminalRef.current) {
      term.open(terminalRef.current);
      fitAddon.fit();
    }

    term.onData(data => ipcRenderer.send('pty-write', { id, data }));
    ipcRenderer.on(`pty-data-${id}`, (_, data) => term.write(data));

    xtermRef.current = term;
    ipcRenderer.send('pty-create', { id, shell: '/bin/bash', cwd: process.env.HOME });

    return () => term.dispose();
  }, [id]);

  return <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />;
};
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add xterm.js terminal component"
```

---

### Task 4: Persistence & Sidebar

**Files:**
- Create: `native/src/main/store.ts`
- Create: `native/src/renderer/components/Sidebar.tsx`

- [ ] **Step 1: Implement simple JSON Store**

```typescript
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const storePath = path.join(app.getPath('userData'), 'sessions.json');

export function saveSessions(sessions: any) {
  fs.writeFileSync(storePath, JSON.stringify(sessions));
}

export function loadSessions() {
  if (!fs.existsSync(storePath)) return [];
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}
```

- [ ] **Step 2: Create Sidebar UI**

```tsx
export const Sidebar: React.FC<{ sessions: any[], onSelect: (id: string) => void }> = ({ sessions, onSelect }) => {
  return (
    <div className="sidebar">
      {sessions.map(s => (
        <button key={s.id} onClick={() => onSelect(s.id)}>
          {s.name}
        </button>
      ))}
      <button className="new-session">+ New Session</button>
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add session persistence and sidebar"
```

---

### Task 5: Briefing Engine (Ecosystem Injection)

**Files:**
- Create: `native/src/main/briefing-engine.ts`

- [ ] **Step 1: Implement Context Synthesis**

```typescript
export function generateBrief(persona: string, libraryPath: string) {
  return `
# Overseer Brief
Persona: ${persona}
Library: ${libraryPath}

Instructions: You are in the Overseer Hub. Access skills at the library path.
  `.trim();
}
```

- [ ] **Step 2: Modify pty-manager to inject environment**

```typescript
// In pty-manager.ts
const env = { 
  ...process.env, 
  GEMINI_SYSTEM_MD: briefPath,
  CLAUDE_CONFIG_DIR: overseerConfigDir 
};
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: implement context injection engine"
```

---

### Task 6: Persona & Voice Layer

**Files:**
- Create: `native/src/renderer/components/MascotFrame.tsx`
- Modify: `native/src/renderer/components/Terminal.tsx`

- [ ] **Step 1: Implement Voice Parser**

```typescript
// In Terminal.tsx
ipcRenderer.on(`pty-data-${id}`, (_, data) => {
  term.write(data);
  const voiceMatch = data.match(/<voice>(.*?)<\/voice>/);
  if (voiceMatch) {
    onVoiceDetected(voiceMatch[1]);
  }
});
```

- [ ] **Step 2: Create Mascot Frame**

```tsx
export const MascotFrame: React.FC<{ voiceText?: string }> = ({ voiceText }) => (
  <div className="mascot-container">
    <img src="overseer.svg" />
    {voiceText && <div className="speech-bubble">{voiceText}</div>}
  </div>
);
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add persona voice layer"
```
