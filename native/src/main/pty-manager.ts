import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import { getOrCreateBrief } from './briefing-engine';
import path from 'path';

export class PtyManager {
  private sessions: Map<string, pty.IPty> = new Map();

  createSession(id: string, shell: string, cwd: string, window: BrowserWindow, persona?: string) {
    // Default library path for now - we'll make this configurable later
    const libraryPath = path.join(process.env.HOME || '/', '.overseer', 'skills');

    const briefPath = getOrCreateBrief(id, { 
      persona, 
      libraryPath 
    });

    // Injected environment
    const env = { 
      ...process.env,
      OVERSEER_HUB: 'true',
      OVERSEER_BRIEF: briefPath,
      GEMINI_SYSTEM_MD: briefPath, // For Gemini CLI
      CLAUDE_SYSTEM_PROMPT_FILE: briefPath, // Hypothetical or for custom wrappers
    } as any;

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: cwd,
      env: env
    });

    ptyProcess.onData((data) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`pty-data-${id}`, data);
      }
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`pty-exit-${id}`, { exitCode, signal });
      }
      this.sessions.delete(id);
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

  kill(id: string) {
    this.sessions.get(id)?.kill();
    this.sessions.delete(id);
  }
}
