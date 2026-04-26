import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';

export class PtyManager {
  private sessions: Map<string, pty.IPty> = new Map();

  createSession(id: string, shell: string, cwd: string, window: BrowserWindow) {
    // Basic environment setup
    const env = { ...process.env } as any;

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
