import { useEffect, useState } from 'react'
import { Plus, GitBranch, Folder, Check } from 'lucide-react'
import { getBaseUrl } from '../utils/api'
import Modal from './Modal'
import FileBrowser from './FileBrowser'

interface Repo {
  id: string
  name: string
  path: string
  group_id?: string
}

interface RepositoriesProps {
  onNewSession: () => void
}

export const Repositories = ({ onNewSession }: RepositoriesProps) => {
  const [repos, setRepos] = useState<Repo[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRepo, setNewRepo] = useState({ name: '', path: '' })

  const refresh = () => {
    fetch(`${getBaseUrl()}/api/config`)
      .then(res => res.json())
      .then(data => setRepos(data.repos || []))
      .catch(err => console.error('Failed to fetch config:', err))
  }

  useEffect(() => { refresh() }, [])

  const handleAddRepo = async () => {
    if (!newRepo.name || !newRepo.path) return
    const repo: Repo = {
      id: Math.random().toString(36).substring(7),
      name: newRepo.name,
      path: newRepo.path,
    }
    try {
      await fetch(`${getBaseUrl()}/api/repos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repo),
      })
      setNewRepo({ name: '', path: '' })
      setShowAddModal(false)
      refresh()
    } catch (err) {
      console.error('Failed to add repo:', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Repositories</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your connected repositories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Repository
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {repos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
            <Folder className="w-12 h-12" />
            <p className="text-sm font-medium">No repositories added yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest"
            >
              Add your first repo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map(repo => (
              <div
                key={repo.id}
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <GitBranch className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-200 truncate">{repo.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{repo.path}</p>
                  </div>
                </div>
                <button
                  onClick={onNewSession}
                  className="mt-auto w-full text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest py-2 rounded-lg hover:bg-blue-500/10 transition-all"
                >
                  Launch Agent
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Repository">
        <div className="flex flex-col flex-grow h-full overflow-hidden">
          <div className="space-y-2 mb-4 flex-shrink-0">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Display Name</label>
            <input
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-500 transition-all placeholder:text-slate-700 shadow-inner"
              placeholder="e.g. My Project"
              value={newRepo.name}
              onChange={e => setNewRepo({ ...newRepo, name: e.target.value })}
            />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 mb-2 flex-shrink-0">
            Select the root directory of your Git repository:
          </p>
          <div className="flex-grow min-h-0 mb-4 border border-slate-700 rounded-lg overflow-hidden">
            <FileBrowser
              onSelectPath={path => setNewRepo(prev => ({ ...prev, path }))}
              initialPath={newRepo.path || '/'}
            />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-4 flex-shrink-0">
            Selected path: <strong>{newRepo.path || 'None'}</strong>
          </p>
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
    </div>
  )
}
