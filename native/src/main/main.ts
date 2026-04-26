import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';
import { PtyManager } from './pty-manager';
import { setupAdapters } from './adapter-manager';
import { loadPersonas, type CliType, type CursorMode } from './store';
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

function getLaunchCommand(
  cliType: CliType | undefined,
  yoloMode: boolean | undefined,
  allowedTools: string | undefined,
  cursorMode: CursorMode | undefined,
  agentSessionId: string | undefined,
): string {
  const resume = !!agentSessionId;
  switch (cliType) {
    case 'gemini': {
      let cmd = resume ? `gemini --resume ${agentSessionId}` : 'gemini';
      if (yoloMode) cmd += ' --approval-mode yolo';
      return cmd;
    }
    case 'claude': {
      let cmd = resume ? `claude --resume ${agentSessionId}` : 'claude';
      if (allowedTools) cmd += ` --allowedTools "${allowedTools}"`;
      return cmd;
    }
    case 'cursor-agent': {
      let cmd = resume ? `cursor-agent resume ${agentSessionId}` : 'cursor-agent';
      if (cursorMode) cmd += ` --mode ${cursorMode}`;
      if (yoloMode) cmd += ' --yolo';
      return cmd;
    }
    default:
      return '/bin/bash';
  }
}

// IPC Handlers for PTY
ipcMain.on('pty-create', (event, {
  id, cwd, persona: personaId,
  cliType, yoloMode, allowedTools, cursorMode, agentSessionId
}) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  let personaInstructions = personaId;
  if (personaId) {
    const personas = loadPersonas();
    const persona = personas.find(p => p.id === personaId);
    if (persona) personaInstructions = persona.instructions;
  }

  const launchCmd = getLaunchCommand(
    cliType as CliType | undefined,
    yoloMode,
    allowedTools,
    cursorMode as CursorMode | undefined,
    agentSessionId,
  );

  ptyManager.createSession(id, launchCmd, cwd || process.env.HOME || '/', win, personaInstructions);
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
