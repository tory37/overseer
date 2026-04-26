import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Terminal } from './components/Terminal';
import { Sidebar } from './components/Sidebar';
import { MascotFrame } from './components/MascotFrame';
import { PersonaStudio } from './components/PersonaStudio';
import { Settings, Terminal as TerminalIcon } from 'lucide-react';
import './index.css';

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
  const [voiceText, setVoiceText] = useState<string>('');
  const [view, setView] = useState<'terminal' | 'studio'>('terminal');

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
    setView('terminal');
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
    <div className="flex h-screen bg-[#1a1b26] text-[#a9b1d6] font-sans overflow-hidden">
      <div className="flex flex-col h-full border-r border-[#33467C] bg-[#16161e] shrink-0">
        <Sidebar 
          sessions={sessions} 
          activeId={activeId} 
          onSelect={(id) => { setActiveId(id); setView('terminal'); }} 
          onNew={handleNewSession}
          onArchive={handleArchiveSession}
          onDelete={handleDeleteSession}
        />
        
        <MascotFrame voiceText={voiceText} />

        {/* View Switcher Footer */}
        <div className="p-3 border-t border-[#33467C] flex gap-2 bg-[#1a1b26]/50 backdrop-blur-sm">
          <button 
            onClick={() => setView('terminal')}
            title="Terminal Sessions"
            className={`flex-1 flex items-center justify-center p-2.5 rounded-xl transition-all ${view === 'terminal' ? 'bg-[#33467C] text-white shadow-lg' : 'text-[#565f89] hover:bg-[#33467C]/30 hover:text-[#7aa2f7]'}`}
          >
            <TerminalIcon size={20} />
          </button>
          <button 
            onClick={() => setView('studio')}
            title="Persona Studio"
            className={`flex-1 flex items-center justify-center p-2.5 rounded-xl transition-all ${view === 'studio' ? 'bg-[#33467C] text-white shadow-lg' : 'text-[#565f89] hover:bg-[#33467C]/30 hover:text-[#7aa2f7]'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#1a1b26]">
        <header className="px-6 py-4 border-b border-[#33467C]/50 flex justify-between items-center bg-[#1a1b26]/80 backdrop-blur z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="m-0 text-xl font-black tracking-tighter text-white uppercase">Overseer</h1>
            <div className="h-4 w-[1px] bg-[#33467C]/50" />
            <div className="text-[10px] text-[#7aa2f7] font-mono uppercase tracking-[0.2em] font-bold">
              {view === 'studio' ? 'Agent Forge' : (sessions.find(s => s.id === activeId)?.name || 'Terminal')}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
            <span className="text-[9px] font-mono text-[#565f89] uppercase tracking-widest">System Active</span>
          </div>
        </header>

        <main className="flex-1 relative overflow-hidden">
          {view === 'terminal' ? (
            <div className="h-full p-4">
              {activeId && (
                <Terminal 
                  key={activeId} 
                  id={activeId} 
                  cwd={sessions.find(s => s.id === activeId)?.cwd} 
                  onVoice={setVoiceText}
                />
              )}
            </div>
          ) : (
            <PersonaStudio />
          )}
        </main>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
