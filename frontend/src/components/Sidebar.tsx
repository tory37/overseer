import { useEffect, useState } from 'react'
import { Folder, HardDrive, Search, Settings, Plus, X } from 'lucide-react'

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

  const refresh = () => {
    fetch('http://localhost:8000/api/config')
      .then(res => res.json())
      .then(data => {
        setRepos(data.repos || [])
        setGroups(data.groups || [])
      })
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRepo.name || !newRepo.path) return

    const repo: Repo = {
      id: Math.random().toString(36).substring(7),
      name: newRepo.name,
      path: newRepo.path
    }

    await fetch('http://localhost:8000/api/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repo)
    })

    setNewRepo({ name: '', path: '' })
    setShowAddModal(false)
    refresh()
  }

  return (
    <aside className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/50 relative">
      <div className="p-4 border-bottom border-slate-800 flex items-center gap-2">
        <HardDrive className="w-5 h-5 text-blue-400" />
        <h1 className="font-bold text-lg tracking-tight text-white">Overseer</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Repositories</span>
            <button 
              onClick={() => setShowAddModal(true)}
              className="p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {groups.map(group => (
              <div key={group.id} className="space-y-1">
                <div className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm font-medium">
                  <Folder className="w-4 h-4 text-slate-400" />
                  <span>{group.name}</span>
                </div>
                <div className="pl-4 space-y-1">
                  {repos.filter(r => r.group_id === group.id).map(repo => (
                    <div 
                      key={repo.id} 
                      onClick={() => onSelectRepo(repo)}
                      className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
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
                className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm group"
              >
                <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors"></span>
                <span className="truncate">{repo.name}</span>
              </div>
            ))}

            {repos.length === 0 && groups.length === 0 && (
              <div className="text-center py-8 px-2 border-2 border-dashed border-slate-800 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Empty Library</p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Add your first repo
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm text-slate-400">
          <Search className="w-4 h-4" />
          <span>Search</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm text-slate-400">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </div>
      </div>

      {/* Add Repo Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-semibold text-white">Add Repository</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddRepo} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. My Awesome Project"
                  value={newRepo.name}
                  onChange={e => setNewRepo({...newRepo, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Absolute Path</label>
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="/home/user/src/project"
                  value={newRepo.path}
                  onChange={e => setNewRepo({...newRepo, path: e.target.value})}
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors"
                >
                  Add Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}
