import { useEffect, useState } from 'react'
import { Folder, HardDrive, Search, Settings, Plus } from 'lucide-react'

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

export const Sidebar = () => {
  const [repos, setRepos] = useState<Repo[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    fetch('http://localhost:8000/api/config')
      .then(res => res.json())
      .then(data => {
        setRepos(data.repos)
        setGroups(data.groups)
      })
  }, [])

  return (
    <aside className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/50">
      <div className="p-4 border-bottom border-slate-800 flex items-center gap-2">
        <HardDrive className="w-5 h-5 text-blue-400" />
        <h1 className="font-bold text-lg tracking-tight">Overseer</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Repositories</span>
            <Plus className="w-3 h-3 cursor-pointer hover:text-slate-300" />
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
                    <div key={repo.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>{repo.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Ungrouped Repos */}
            {repos.filter(r => !r.group_id).map(repo => (
              <div key={repo.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>{repo.name}</span>
              </div>
            ))}
            {repos.length === 0 && groups.length === 0 && (
              <p className="text-xs text-slate-600 italic p-2">No repositories added yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <span>Search</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm">
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </div>
      </div>
    </aside>
  )
}
