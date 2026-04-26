import React from 'react';
import { Plus, Terminal as TerminalIcon, Archive, Trash2 } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  isArchived: boolean;
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
    <div style={{ 
      width: '240px', 
      backgroundColor: '#16161e', 
      borderRight: '1px solid #33467C',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#565f89', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sessions</span>
        <button 
          onClick={onNew}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#7aa2f7', 
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        {activeSessions.map(session => (
          <div 
            key={session.id}
            onClick={() => onSelect(session.id)}
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: activeId === session.id ? '#33467C' : 'transparent',
              color: activeId === session.id ? '#fff' : '#a9b1d6',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '4px',
              transition: 'background-color 0.2s'
            }}
          >
            <TerminalIcon size={16} style={{ marginRight: '10px', opacity: activeId === session.id ? 1 : 0.6 }} />
            <span style={{ fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.name}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onArchive(session.id); }}
              style={{ background: 'none', border: 'none', color: '#565f89', cursor: 'pointer', padding: '2px' }}
            >
              <Archive size={14} />
            </button>
          </div>
        ))}

        {archivedSessions.length > 0 && (
          <>
            <div style={{ padding: '20px 10px 10px', color: '#565f89', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Archive</div>
            {archivedSessions.map(session => (
              <div 
                key={session.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: '#565f89',
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '4px',
                  opacity: 0.7
                }}
              >
                <span style={{ fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.name}</span>
                <button 
                  onClick={() => onDelete(session.id)}
                  style={{ background: 'none', border: 'none', color: '#f7768e', cursor: 'pointer', padding: '2px' }}
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
