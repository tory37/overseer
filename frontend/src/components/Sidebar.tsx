import { useEffect, useState } from 'react'
import { Folder, Search, Settings, Plus, X, GitBranch, Terminal, ChevronRight, FolderOpen, Home } from 'lucide-react'
import { getBaseUrl } from '../App'

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
}

export const Sidebar = ({ onSelectRepo }: SidebarProps) => {
  const [repos, setRepos] = useState<Repo[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRepo, setNewRepo] = useState({ name: '', path: '' })
  
  // Browser state
  const [browserEntries, setBrowserEntries] = useState<{name: string, path: string, is_dir: boolean}[]>([])
  const [currentBrowserPath, setCurrentBrowserPath] = useState('')
  const [showBrowser, setShowBrowser] = useState(false)

  const refresh = () => {
    fetch(`${getBaseUrl()}/api/config`)
      .then(res => res.json())
      .then(data => {
        setRepos(data.repos || [])
        setGroups(data.groups || [])
      })
      .catch(err => console.error("Failed to fetch config:", err))
  }

  const loadBrowser = (path: string = '') => {
    const url = `${getBaseUrl()}/api/ls?path=${encodeURIComponent(path)}`
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.entries) {
          setBrowserEntries(data.entries)
          setCurrentBrowserPath(data.current_path)
        }
      })
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (showBrowser) {
      loadBrowser(currentBrowserPath)
    }
  }, [showBrowser])

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setShowBrowser(false)
      refresh()
    } catch (err) {
      console.error("Failed to add repo:", err)
    }
  }

  const selectPathFromBrowser = (path: string) => {
    setNewRepo(prev => ({ ...prev, path }))
    setShowBrowser(false)
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

            {repos.length === 0 && groups.length === 0 && (
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
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <Search className="w-4 h-4" />
          <span>Global Search</span>
        </button>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <Settings className="w-4 h-4" />
          <span>Configuration</span>
        </button>
      </div>

      {/* Modern Add Repo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-slate-100">Add Repository</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddRepo} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Display Name</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-500 transition-all placeholder:text-slate-700"
                  placeholder="e.g. Overseer UI"
                  value={newRepo.name}
                  onChange={e => setNewRepo({...newRepo, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Local Directory Path</label>
                <div className="relative group/path">
                  <input 
                    readOnly
                    onClick={() => setShowBrowser(!showBrowser)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none cursor-pointer hover:border-slate-600 transition-all placeholder:text-slate-700 font-mono"
                    placeholder="Click to browse..."
                    value={newRepo.path}
                  />
                  <div className="absolute right-3 top-3 p-1 rounded hover:bg-slate-800 text-slate-500 group-hover/path:text-blue-500 transition-colors">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                </div>

                {/* Directory Browser Sub-Modal/Dropdown */}
                {showBrowser && (
                  <div className="mt-2 bg-slate-950 border border-slate-800 rounded-xl max-h-64 overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 px-2 overflow-hidden">
                        <Home className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{currentBrowserPath || 'Root'}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => selectPathFromBrowser(currentBrowserPath)}
                        className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-white uppercase"
                      >
                        Select
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                      {browserEntries.map((entry) => (
                        <div 
                          key={entry.path}
                          onClick={() => entry.name === '..' ? loadBrowser(entry.path) : loadBrowser(entry.path)}
                          className="flex items-center justify-between p-2 rounded hover:bg-slate-800 cursor-pointer transition-colors group/entry"
                        >
                          <div className="flex items-center gap-3">
                            <Folder className={`w-4 h-4 ${entry.name === '..' ? 'text-slate-600' : 'text-blue-500/60'}`} />
                            <span className={`text-xs ${entry.name === '..' ? 'text-slate-500' : 'text-slate-300'}`}>
                              {entry.name}
                            </span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-700 opacity-0 group-hover/entry:opacity-100 transition-all" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-slate-600 px-1">Ensure this directory is a valid Git repository.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-300 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newRepo.name || !newRepo.path}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                >
                  Register Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}
