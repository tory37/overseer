import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';
import { PtyManager } from './pty-manager';
import { setupAdapters } from './adapter-manager';
import './store'; // Register store IPC handlers
import './skills-manager'; // Register skills IPC handlers
import './agents-manager'; // Register agents IPC handlers
import './git-utils'; // Register git IPC handlers

const ptyManager = new PtyManager();

// Setup adapters on startup
setupAdapters();

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
  
  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers for PTY
ipcMain.on('pty-create', (event, { id, shell, cwd, persona }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    ptyManager.createSession(id, shell || '/bin/bash', cwd || process.env.HOME || '/', win, persona);
  }
});

ipcMain.on('pty-write', (event, { id, data }) => {
  ptyManager.write(id, data);
});

ipcMain.on('pty-resize', (event, { id, cols, rows }) => {
  ptyManager.resize(id, cols, rows);
});

ipcMain.on('pty-kill', (event, { id }) => {
  ptyManager.kill(id);
});
