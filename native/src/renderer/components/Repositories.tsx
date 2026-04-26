import React, { useState, useEffect } from 'react';
import { Plus, GitBranch, Folder, Check, Trash2, FolderOpen, Play } from 'lucide-react';
import { Repository } from '../types';
import { Modal } from './Modal';

const { ipcRenderer } = (window as any).require('electron');

interface RepositoriesProps {
  onLaunchSession: (repo: Repository) => void;
}

export const Repositories: React.FC<RepositoriesProps> = ({ onLaunchSession }) => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRepo, setNewRepo] = useState({ name: '', path: '' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchRepos = async () => {
    try {
      const data = await ipcRenderer.invoke('store-load-repos');
      setRepos(data || []);
    } catch (err) {
      console.error('Failed to load repositories:', err);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleSelectPath = async () => {
    const path = await ipcRenderer.invoke('dialog-select-directory');
    if (path) {
      setNewRepo(prev => ({ 
        ...prev, 
        path,
        name: prev.name || path.split(/[/\\]/).pop() || '' 
      }));
    }
  };

  const handleAddRepo = async () => {
    if (!newRepo.name || !newRepo.path) return;
    const repo: Repository = {
      id: Math.random().toString(36).substring(7),
      name: newRepo.name,
      path: newRepo.path,
    };
    
    const updatedRepos = [...repos, repo];
    setRepos(updatedRepos);
    ipcRenderer.send('store-save-repos', updatedRepos);
    
    setNewRepo({ name: '', path: '' });
    setShowAddModal(false);
  };

  const handleDeleteRepo = (id: string) => {
    if (!window.confirm('Are you sure you want to remove this repository from Overseer? (Original files will not be deleted)')) return;
    const updatedRepos = repos.filter(r => r.id !== id);
    setRepos(updatedRepos);
    ipcRenderer.send('store-save-repos', updatedRepos);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-800/50 flex items-center justify-between flex-shrink-0 bg-slate-900/10">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Worktree Hub</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">Manage your project environments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Repository
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {repos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-slate-600 p-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center border border-slate-800">
              <GitBranch className="w-10 h-10 text-slate-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-300">No repositories yet</h3>
              <p className="text-sm max-w-xs leading-relaxed">
                Connect your local Git repositories to enable project-specific agent sessions and worktree isolation.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-blue-500/10 transition-all"
            >
              Add your first repository
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {repos.map(repo => (
              <div
                key={repo.id}
                className="group relative p-6 rounded-3xl bg-slate-900/40 border border-slate-800/50 hover:border-blue-500/30 hover:bg-slate-900/60 transition-all flex flex-col gap-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/10 transition-colors">
                    <GitBranch className="w-6 h-6 text-blue-400" />
                  </div>
                  <button 
                    onClick={() => handleDeleteRepo(repo.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-200 truncate">{repo.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                    <FolderOpen className="w-3 h-3 flex-shrink-0" />
                    <p className="text-[10px] font-mono truncate">{repo.path}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/50">
                  <button
                    onClick={() => onLaunchSession(repo)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 hover:bg-blue-600 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all shadow-md active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Launch Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Connect Repository">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Display Name</label>
            <input
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-700"
              placeholder="e.g. Project X"
              value={newRepo.name}
              onChange={e => setNewRepo({ ...newRepo, name: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Repository Path</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-slate-400 truncate font-mono">
                {newRepo.path || 'No directory selected...'}
              </div>
              <button 
                onClick={handleSelectPath}
                className="px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-bold text-slate-300 transition-all"
              >
                Browse
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-blue-500/10 bg-blue-500/5 flex gap-3">
            <Folder className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Connecting a repository allows Overseer to manage Git worktrees for task isolation.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-400 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRepo}
              disabled={!newRepo.name || !newRepo.path}
              className="flex-[2] px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-white shadow-xl shadow-blue-900/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Connect Repository
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
