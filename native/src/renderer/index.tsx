import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Terminal } from './components/Terminal';
import { Sidebar } from './components/Sidebar';

const { ipcRenderer } = window.require('electron');

interface Session {
  id: string;
  name: string;
  cwd: string;
  isArchived: boolean;
}

const App = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const savedSessions = await ipcRenderer.invoke('store-load-sessions');
      if (savedSessions && savedSessions.length > 0) {
        setSessions(savedSessions);
        setActiveId(savedSessions.find((s: any) => !s.isArchived)?.id || savedSessions[0].id);
      } else {
        const defaultSession = { id: 'default', name: 'Main Terminal', cwd: process.env.HOME || '/', isArchived: false };
        setSessions([defaultSession]);
        setActiveId('default');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      ipcRenderer.send('store-save-sessions', sessions);
    }
  }, [sessions]);

  const handleNewSession = () => {
    const id = `session-${Date.now()}`;
    const newSession = { id, name: `Session ${sessions.length + 1}`, cwd: process.env.HOME || '/', isArchived: false };
    setSessions([...sessions, newSession]);
    setActiveId(id);
  };

  const handleArchiveSession = (id: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, isArchived: true } : s));
    if (activeId === id) {
      const next = sessions.find(s => s.id !== id && !s.isArchived);
      setActiveId(next?.id || '');
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    ipcRenderer.send('pty-kill', { id });
  };

  return (
    <div style={{ backgroundColor: '#1a1b26', color: '#a9b1d6', height: '100vh', display: 'flex', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
      <Sidebar 
        sessions={sessions} 
        activeId={activeId} 
        onSelect={setActiveId} 
        onNew={handleNewSession}
        onArchive={handleArchiveSession}
        onDelete={handleDeleteSession}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '10px 20px', borderBottom: '1px solid #33467C', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Overseer</h1>
          <div style={{ fontSize: '0.9rem', color: '#565f89' }}>
            {sessions.find(s => s.id === activeId)?.name || 'No Active Session'}
          </div>
        </header>
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {activeId && <Terminal key={activeId} id={activeId} cwd={sessions.find(s => s.id === activeId)?.cwd} />}
        </main>
      </div>
    </div>
  );
};

// Global styles for the app
const style = document.createElement('style');
style.textContent = `
  body { margin: 0; padding: 0; overflow: hidden; background-color: #1a1b26; }
  #root { height: 100vh; }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #33467C; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #4a5d8e; }
`;
document.head.appendChild(style);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
