import { useEffect, useState } from 'react'
import { Folder, Search, Settings, Plus, GitBranch, Terminal, Check, Ghost } from 'lucide-react'
import { getBaseUrl } from '../utils/api'
import Modal from './Modal' // Import the new Modal component
import FileBrowser from './FileBrowser' // Import the new FileBrowser component

interface Repo {
  id: string
  name: string
  path: string
  group_id?: string
}

interface Group {
  id: string
  name: string
  parent_id?: string
}

interface SidebarProps {
  onSelectRepo: (repo: Repo) => void
  onNewSession: () => void
  onOpenSpecialTab: (type: 'agent' | 'persona-lab' | 'config' | 'search') => void
}

export const Sidebar = ({ onSelectRepo, onNewSession, onOpenSpecialTab }: SidebarProps) => {
  const [repos, setRepos] = useState<Repo[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRepo, setNewRepo] = useState({ name: '', path: '' })
  
  const refresh = () => {
    fetch(`${getBaseUrl()}/api/config`)
      .then(res => res.json())
      .then(data => {
        setRepos(data.repos || [])
        setGroups(data.groups || [])
      })
      .catch(err => console.error("Failed to fetch config:", err))
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleAddRepo = async () => { // Removed 'e: React.FormEvent' and e.preventDefault()
    if (!newRepo.name || !newRepo.path) return

    const repo: Repo = {
      id: Math.random().toString(36).substring(7),
      name: newRepo.name,
      path: newRepo.path
    }

    try {
      await fetch(`${getBaseUrl()}/api/repos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repo)
      })
      setNewRepo({ name: '', path: '' })
      setShowAddModal(false)
      refresh()
    } catch (err) {
      console.error("Failed to add repo:", err)
    }
  }

  return (
    <aside className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/80 backdrop-blur-md">
      {/* Brand Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Terminal className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight text-slate-100">Overseer</h1>
      </div>

      <div className="px-3 py-2">
        <button 
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98] group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>New Agent Session</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
        {/* Repo Section */}
        <section>
          <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">
            <span>Repositories</span>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 transition-all"
              title="Add Repository"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {groups.map(group => (
              <div key={group.id} className="space-y-0.5">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-800/50 cursor-pointer text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
                  <Folder className="w-4 h-4 text-slate-500" />
                  <span>{group.name}</span>
                </div>
                <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-4">
                  {repos.filter(r => r.group_id === group.id).map(repo => (
                    <div
                      key={repo.id}
                      onClick={() => onSelectRepo(repo)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-blue-600/10 hover:text-blue-400 cursor-pointer text-sm text-slate-400 transition-all group"
                    >
                      <GitBranch className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                      <span className="truncate">{repo.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Ungrouped Repos */}
            {repos.filter(r => !r.group_id).map(repo => (
              <div
                key={repo.id}
                onClick={() => onSelectRepo(repo)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-blue-600/10 hover:text-blue-400 cursor-pointer text-sm text-slate-400 transition-all group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-all"></div>
                <span className="truncate">{repo.name}</span>
              </div>
            ))}

            {repos.length === 0 && (
              <div className="mt-4 p-4 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Workspace Ready</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-xs text-blue-500 hover:text-blue-400 font-semibold underline underline-offset-4"
                >
                  Add your first repo
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-800/60 bg-slate-950/40 space-y-1">
        <button 
          onClick={() => onOpenSpecialTab('persona-lab')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Ghost className="w-4 h-4" />
          <span>Persona Studio</span>
        </button>
        <button 
          onClick={() => onOpenSpecialTab('search')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Global Search</span>
        </button>
        <button 
          onClick={() => onOpenSpecialTab('config')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Configuration</span>
        </button>
      </div>

      {/* New Add Repo Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Repository"
      >
        <div className="flex flex-col flex-grow h-full overflow-hidden">
          <div className="space-y-2 mb-4 flex-shrink-0">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Display Name</label>
            <input
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-500 transition-all placeholder:text-slate-700 shadow-inner"
              placeholder="e.g. My Project"
              value={newRepo.name}
              onChange={e => setNewRepo({...newRepo, name: e.target.value})}
            />
          </div>

          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 mb-2 flex-shrink-0">Select the root directory of your Git repository:</p>
          <div className="flex-grow min-h-0 mb-4 border border-slate-700 rounded-lg overflow-hidden">
            <FileBrowser onSelectPath={(path) => setNewRepo(prev => ({ ...prev, path }))} initialPath={newRepo.path || '/'} />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-4 flex-shrink-0">Selected path: <strong>{newRepo.path || 'None'}</strong></p>

          <div className="pt-4 flex gap-4 flex-shrink-0">
            <button
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-400 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRepo}
              disabled={!newRepo.name || !newRepo.path}
              className="flex-[2] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-white shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Add Repository
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
