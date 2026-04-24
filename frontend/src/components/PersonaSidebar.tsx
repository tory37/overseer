import React, { useState } from 'react';
import { Ghost, Search, Settings, Terminal, Folder, Plus } from 'lucide-react';
import type { Persona } from '../utils/api';
import type { SpecialView } from './PersonaLayout';

export interface SessionData {
  id: string;
  name: string;
  cwd?: string;
  command?: string;
  personaId?: string | null;
  type: string;
}

export const SessionItem = ({ title, isActive, onClick }: { title: string; isActive: boolean; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer px-2 py-1.5 rounded-md text-sm transition-colors ${isActive ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
  >
    {title}
  </div>
);

const PersonaGroup = ({
  name,
  sessions,
  selectedSessionId,
  onSelectSession,
}: {
  name: string;
  sessions: SessionData[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="text-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left font-bold text-slate-400 py-1.5 px-2 hover:text-white flex items-center gap-1 rounded-md hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-[10px]">{expanded ? '▼' : '▶'}</span>
        <Ghost className="w-3.5 h-3.5 ml-0.5" />
        <span className="ml-1">{name}</span>
      </button>
      {expanded && (
        <div className="pl-5 mt-1 space-y-0.5 border-l border-slate-800 ml-4">
          {sessions.map(session => (
            <SessionItem
              key={session.id}
              title={session.name}
              isActive={session.id === selectedSessionId}
              onClick={() => onSelectSession(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface PersonaSidebarProps {
  sessions: SessionData[];
  personas: Persona[];
  selectedSessionId: string | null;
  specialView: SpecialView | null;
  onSelectSession: (id: string) => void;
  onOpenSpecialView: (type: SpecialView) => void;
  onNewSession: () => void;
}

export const PersonaSidebar = ({
  sessions,
  personas,
  selectedSessionId,
  specialView,
  onSelectSession,
  onOpenSpecialView,
  onNewSession,
}: PersonaSidebarProps) => {
  const agentSessions = sessions.filter(s => s.type === 'agent');

  const grouped = new Map<string | null, SessionData[]>();
  for (const session of agentSessions) {
    const key = session.personaId ?? null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(session);
  }

  const namedGroups = personas
    .filter(p => grouped.has(p.id))
    .map(p => ({ name: p.name, sessions: grouped.get(p.id)! }));

  const ungrouped = grouped.get(null) ?? [];

  const footerBtn = (active: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
      active
        ? 'bg-slate-800 text-slate-100'
        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
    }`;

  return (
    <aside className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/80 backdrop-blur-md h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Terminal className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight text-slate-100">Overseer</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
        <section>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">Sessions</span>
            <button
              onClick={onNewSession}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 transition-all"
              title="New Session"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {namedGroups.map(group => (
              <PersonaGroup
                key={group.name}
                name={group.name}
                sessions={group.sessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={onSelectSession}
              />
            ))}
            {ungrouped.length > 0 && (
              <PersonaGroup
                name="Default Persona"
                sessions={ungrouped}
                selectedSessionId={selectedSessionId}
                onSelectSession={onSelectSession}
              />
            )}
            {agentSessions.length === 0 && (
              <div className="px-2 py-4 text-center text-xs text-slate-600">
                No active sessions.{' '}
                <button onClick={onNewSession} className="text-blue-500 hover:text-blue-400">
                  Start one
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-3 border-t border-slate-800/60 bg-slate-950/40 space-y-1">
        <button onClick={() => onOpenSpecialView('persona-studio')} className={footerBtn(specialView === 'persona-studio')}>
          <Ghost className="w-4 h-4" />
          <span>Persona Lab</span>
        </button>
        <button onClick={() => onOpenSpecialView('repositories')} className={footerBtn(specialView === 'repositories')}>
          <Folder className="w-4 h-4" />
          <span>Repositories</span>
        </button>
        <button onClick={() => onOpenSpecialView('config')} className={footerBtn(specialView === 'config')}>
          <Settings className="w-4 h-4" />
          <span>Configuration</span>
        </button>
        <button onClick={() => onOpenSpecialView('search')} className={footerBtn(specialView === 'search')}>
          <Search className="w-4 h-4" />
          <span>Global Search</span>
        </button>
      </div>
    </aside>
  );
};
