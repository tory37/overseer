import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import { getOrCreateBrief } from './briefing-engine';
import { getOverseerBinDir } from './adapter-manager';
import path from 'path';
import os from 'os';

export class PtyManager {
  private sessions: Map<string, pty.IPty> = new Map();

  createSession(id: string, shell: string, cwd: string, window: BrowserWindow, persona?: string) {
    const skillsPath = path.join(os.homedir(), '.overseer', 'skills');
    const agentsPath = path.join(os.homedir(), '.overseer', 'agents');
    const binPath = getOverseerBinDir();

    const briefPath = getOrCreateBrief(id, { 
      persona, 
      skillsPath,
      agentsPath
    });

    // Injected environment
    const env = { 
      ...process.env,
      PATH: `${binPath}${path.delimiter}${process.env.PATH}`,
      OVERSEER_HUB: 'true',
      OVERSEER_BRIEF: briefPath,
      OVERSEER_SKILLS_DIR: skillsPath,
      OVERSEER_AGENTS_DIR: agentsPath,
      GEMINI_SYSTEM_MD: briefPath, // For Gemini CLI
      CLAUDE_SYSTEM_PROMPT_FILE: briefPath, // Supported by our wrapper
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
