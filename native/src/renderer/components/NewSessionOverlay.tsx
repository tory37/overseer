import React, { useState, useEffect } from 'react';
import { X, Play, GitBranch, Terminal, User, Info, Check } from 'lucide-react';
import { Repository, Persona } from '../types';
import { AgentAvatar } from './AgentAvatar';

const { ipcRenderer } = (window as any).require('electron');

interface NewSessionOverlayProps {
  repository: Repository;
  onClose: () => void;
  onLaunch: (config: {
    name: string;
    path: string;
    personaId: string | null;
    command: string;
    isWorktree: boolean;
    worktreeName: string;
    baseBranch: string;
  }) => void;
}

export const NewSessionOverlay: React.FC<NewSessionOverlayProps> = ({ repository: initialRepo, onClose, onLaunch }) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository>(initialRepo);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [showPersonaInfo, setShowPersonaInfo] = useState<string | null>(null);
  const [isWorktree, setIsWorktree] = useState(false);
  const [worktreeName, setWorktreeName] = useState('');
  const [baseBranch, setBaseBranch] = useState('master');
  const [command, setCommand] = useState('gemini --approval-mode yolo');
  const [sessionName, setSessionName] = useState(`${initialRepo.name} Session`);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedPersonas, loadedRepos] = await Promise.all([
          ipcRenderer.invoke('store-load-personas'),
          ipcRenderer.invoke('store-load-repos')
        ]);
        
        setPersonas(loadedPersonas || []);
        if (loadedPersonas?.length > 0 && !selectedPersonaId) {
          setSelectedPersonaId(loadedPersonas[0].id);
        }

        // Add the local-cwd if it doesn't exist in saved repos
        const allRepos = loadedRepos || [];
        const hasLocal = allRepos.find((r: Repository) => r.id === 'local-cwd');
        if (!hasLocal && initialRepo.id === 'local-cwd') {
          allRepos.unshift(initialRepo);
        }
        setRepositories(allRepos);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const loadedBranches = await ipcRenderer.invoke('git-list-branches', { repoPath: selectedRepo.path });
        setBranches(loadedBranches || []);
        if (loadedBranches.includes('master')) setBaseBranch('master');
        else if (loadedBranches.includes('main')) setBaseBranch('main');
        else if (loadedBranches.length > 0) setBaseBranch(loadedBranches[0]);
      } catch (err) {
        console.error('Failed to load branches:', err);
        setBranches([]);
      }
    };
    loadBranches();
    
    // Update session name if it was the default for the previous repo
    if (sessionName.includes('Session')) {
      setSessionName(`${selectedRepo.name} Session`);
    }
  }, [selectedRepo]);

  const handleLaunch = () => {
    onLaunch({
      name: sessionName,
      path: selectedRepo.path,
      personaId: selectedPersonaId,
      command,
      isWorktree,
      worktreeName,
      baseBranch
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] shadow-2xl shadow-black/50 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Launch Session</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">
                Configuring context for <span className="text-blue-400">{selectedRepo.name}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 divide-x divide-slate-800 overflow-hidden">
          {/* Left Column: Workspace Config */}
          <div className="flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Active Repository</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all appearance-none"
                  value={selectedRepo.id}
                  onChange={e => {
                    const repo = repositories.find(r => r.id === e.target.value);
                    if (repo) setSelectedRepo(repo);
                  }}
                >
                  {repositories.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.path})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Session Name</label>
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace Isolation</label>
                  <div 
                    onClick={() => setIsWorktree(!isWorktree)}
                    className={`w-12 h-6 rounded-full transition-all cursor-pointer relative p-1 ${isWorktree ? 'bg-blue-600' : 'bg-slate-800'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isWorktree ? 'ml-6' : 'ml-0'}`} />
                  </div>
                </div>

                {isWorktree ? (
                  <div className="p-6 rounded-2xl bg-blue-600/5 border border-blue-500/20 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">New Worktree Name</label>
                      <input 
                        autoFocus
                        className="w-full bg-slate-950 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                        placeholder="e.g. fix-auth-bug"
                        value={worktreeName}
                        onChange={e => setWorktreeName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Base Branch</label>
                      <select 
                        className="w-full bg-slate-950 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all appearance-none"
                        value={baseBranch}
                        onChange={e => setBaseBranch(e.target.value)}
                      >
                        {branches.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 border-dashed flex items-center justify-center text-center">
                    <p className="text-xs text-slate-500 max-w-[240px]">
                      Session will run directly in the repository root. No isolation.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Startup Command</label>
                <div className="relative group">
                  <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-sm font-mono text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                    value={command}
                    onChange={e => setCommand(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Persona Selection */}
          <div className="flex flex-col p-8 space-y-6 overflow-y-auto custom-scrollbar bg-slate-900/50">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Select Agent Persona</h3>
            <div className="space-y-3">
              {personas.map(persona => (
                <div key={persona.id} className="group flex flex-col gap-2">
                  <div
                    onClick={() => setSelectedPersonaId(persona.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedPersonaId === persona.id
                        ? 'bg-blue-600/10 border-blue-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <AgentAvatar 
                      avatarConfig={persona.avatarConfig} 
                      className={`w-12 h-12 rounded-xl bg-slate-900 flex-shrink-0 ${selectedPersonaId === persona.id ? '' : 'grayscale opacity-50'}`} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-bold text-sm truncate ${selectedPersonaId === persona.id ? 'text-blue-400' : 'text-slate-300'}`}>
                          {persona.name}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPersonaInfo(showPersonaInfo === persona.id ? null : persona.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            showPersonaInfo === persona.id 
                              ? 'bg-slate-800 text-blue-400' 
                              : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{persona.title}</p>
                    </div>
                    {selectedPersonaId === persona.id && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  {showPersonaInfo === persona.id && (
                    <div className="mx-2 p-4 bg-slate-950 border border-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed animate-in slide-in-from-top-1">
                      {persona.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <GitBranch className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[400px]">
              {selectedRepo.name} {isWorktree && `/ Worktree: ${worktreeName || '...'}`}
            </span>
          </div>
          <button 
            onClick={handleLaunch}
            disabled={isWorktree && !worktreeName}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-900/30 transition-all active:scale-95 flex items-center gap-3"
          >
            <Play className="w-4 h-4 fill-current" />
            Engage Agent
          </button>
        </div>
      </div>
    </div>
  );
};

