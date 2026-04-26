import React from 'react';
import { Plus, Terminal as TerminalIcon, Archive, Trash2 } from 'lucide-react';
import { AgentAvatar } from './AgentAvatar';
import { Persona } from '../types';

interface Session {
  id: string;
  name: string;
  isArchived: boolean;
  persona?: string;
  personaConfig?: Persona;
}

interface SidebarProps {
  sessions: Session[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeId, 
  onSelect, 
  onNew, 
  onArchive, 
  onDelete 
}) => {
  const activeSessions = sessions.filter(s => !s.isArchived);
  const archivedSessions = sessions.filter(s => s.isArchived);

  return (
    <div className="w-60 bg-[#16161e] border-r border-[#33467C] flex flex-col h-full overflow-hidden">
      <div className="p-5 flex justify-between items-center">
        <span className="text-[#565f89] text-[10px] font-bold uppercase tracking-[0.2em]">Sessions</span>
        <button 
          onClick={onNew}
          className="bg-transparent border-none text-[#7aa2f7] hover:text-[#89b4fa] cursor-pointer p-1 flex items-center transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {activeSessions.map(session => (
          <div 
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`
              group p-2.5 rounded-lg cursor-pointer flex items-center gap-3 transition-all
              ${activeId === session.id ? 'bg-[#33467C] text-white shadow-lg' : 'text-[#a9b1d6] hover:bg-[#33467C]/30'}
            `}
          >
            {session.personaConfig ? (
              <AgentAvatar 
                avatarConfig={session.personaConfig.avatarConfig} 
                size={20} 
                className={activeId === session.id ? '' : 'grayscale opacity-50'}
              />
            ) : (
              <TerminalIcon size={16} className={activeId === session.id ? 'opacity-100' : 'opacity-40'} />
            )}
            <span className="text-sm font-medium flex-1 truncate">{session.name}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onArchive(session.id); }}
              className="opacity-0 group-hover:opacity-100 bg-transparent border-none text-[#565f89] hover:text-[#7aa2f7] cursor-pointer p-1 transition-all"
            >
              <Archive size={14} />
            </button>
          </div>
        ))}

        {archivedSessions.length > 0 && (
          <>
            <div className="px-3 pt-6 pb-2 text-[#565f89] text-[9px] font-bold uppercase tracking-widest">Archive</div>
            {archivedSessions.map(session => (
              <div 
                key={session.id}
                className="group p-2 px-3 rounded-lg text-[#565f89] flex items-center gap-3 hover:bg-slate-800/20 transition-all"
              >
                <span className="text-xs flex-1 truncate">{session.name}</span>
                <button 
                  onClick={() => onDelete(session.id)}
                  className="opacity-0 group-hover:opacity-100 bg-transparent border-none text-[#f7768e] hover:text-red-400 cursor-pointer p-1 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
