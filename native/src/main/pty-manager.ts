import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import { getOrCreateBrief } from './briefing-engine';
import { getOverseerBinDir } from './adapter-manager';
import { loadSessions, saveSessions } from './store';
import path from 'path';
import os from 'os';

const ANSI_STRIP = /\[[0-9;]*[mKHF]/g;

const ID_PATTERNS: Record<string, RegExp> = {
  claude:  /Session ID:\s+([a-f0-9-]{36})/i,
  gemini:  /Session ID:\s+([a-z0-9]{32})/i,
  cursor:  /Thread ID:\s+([a-z0-9-]+)/i,
};

export class PtyManager {
  private sessions: Map<string, pty.IPty> = new Map();

  createSession(id: string, command: string, cwd: string, window: BrowserWindow, persona?: string) {
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

    const [bin, ...args] = command.split(' ');
    const ptyProcess = pty.spawn(bin, args, {
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

      const clean = data.toString().replace(//g, '\x1b').replace(/\x1b/g, '').replace(ANSI_STRIP, '');
      for (const pattern of Object.values(ID_PATTERNS)) {
        const match = clean.match(pattern);
        if (match) {
          const agentSessionId = match[1];
          const all = loadSessions();
          const session = all.find(s => s.id === id);
          if (session && session.agentSessionId !== agentSessionId) {
            session.agentSessionId = agentSessionId;
            saveSessions(all);
          }
          break;
        }
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
