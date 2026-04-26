import fs from 'fs';
import path from 'path';
import { app, ipcMain } from 'electron';

const storePath = path.join(app.getPath('userData'), 'sessions.json');

export interface SessionMetadata {
  id: string;
  name: string;
  cwd: string;
  persona?: string;
  lastUsed: number;
  isArchived: boolean;
}

export function saveSessions(sessions: SessionMetadata[]) {
  fs.writeFileSync(storePath, JSON.stringify(sessions, null, 2));
}

export function loadSessions(): SessionMetadata[] {
  if (!fs.existsSync(storePath)) return [];
  try {
    const data = fs.readFileSync(storePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load sessions:', e);
    return [];
  }
}

// IPC Handlers for Store
ipcMain.handle('store-load-sessions', () => {
  return loadSessions();
});

ipcMain.on('store-save-sessions', (event, sessions: SessionMetadata[]) => {
  saveSessions(sessions);
});
