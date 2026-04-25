import React, { useState, useEffect } from 'react';
import { PersonaSidebar, type SessionData } from './PersonaSidebar';
import { TabContainer } from './TabContainer';
import { Configuration } from './Configuration';
import { Repositories } from './Repositories';
import PersonaStudio from './PersonaStudio';
import { SkillLibrary } from './SkillLibrary';
import type { Persona } from '../utils/api';
import { Terminal } from 'lucide-react';

export type SpecialView = 'persona-studio' | 'config' | 'search' | 'repositories' | 'skill-library';

interface Tab {
  id: string;
  type: string;
  name: string;
  cwd?: string;
  command?: string;
  personaId?: string | null;
  active: boolean;
}

interface PersonaLayoutProps {
  tabs: Tab[];
  personas: Persona[];
  onPersonaCreated: () => void;
  onNewSession: () => void;
  onCloseSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export const PersonaLayout: React.FC<PersonaLayoutProps> = ({
  tabs,
  personas,
  onPersonaCreated,
  onNewSession,
  onCloseSession,
  onDeleteSession,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [specialView, setSpecialView] = useState<SpecialView | null>(null);

  const agentSessions = tabs.filter(t => t.type === 'agent');

  useEffect(() => {
    const activeSession = agentSessions.find(s => s.active);
    if (activeSession && activeSession.id !== selectedSessionId) {
      setSelectedSessionId(activeSession.id);
      setSpecialView(null);
      return;
    }
    if (selectedSessionId && !agentSessions.some(s => s.id === selectedSessionId)) {
      setSelectedSessionId(agentSessions[0]?.id ?? null);
    }
  }, [tabs]);

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setSpecialView(null);
  };

  const handleOpenSpecialView = (type: SpecialView) => {
    setSpecialView(type);
    setSelectedSessionId(null);
  };

  const selectedSession = agentSessions.find(t => t.id === selectedSessionId);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <PersonaSidebar
        sessions={tabs as SessionData[]}
        personas={personas}
        selectedSessionId={selectedSessionId}
        specialView={specialView}
        onSelectSession={handleSelectSession}
        onOpenSpecialView={handleOpenSpecialView}
        onNewSession={onNewSession}
        onDeleteSession={onDeleteSession}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        {specialView === 'persona-studio' && <PersonaStudio onPersonaChanged={onPersonaCreated} />}
        {specialView === 'skill-library' && <SkillLibrary />}
        {specialView === 'config' && <Configuration />}
        {specialView === 'repositories' && <Repositories onNewSession={onNewSession} />}
        {specialView === 'search' && (
          <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-medium">
            Global Search (Coming Soon)
          </div>
        )}
        {!specialView && selectedSession && (
          <TabContainer
            key={selectedSession.id}
            id={selectedSession.id}
            cwd={selectedSession.cwd}
            command={selectedSession.command}
            personaId={selectedSession.personaId}
            personas={personas}
            onPersonaCreated={onPersonaCreated}
            onClose={() => onCloseSession(selectedSession.id)}
          />
        )}
        {!specialView && !selectedSession && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
            <Terminal className="w-10 h-10" />
            <p className="text-sm font-medium">No active session selected.</p>
            <button
              onClick={onNewSession}
              className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest"
            >
              Start a new session
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PersonaLayout;
