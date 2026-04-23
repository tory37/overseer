import { useState, useEffect } from 'react'
import { X, Plus, Terminal, Search, Folder, Zap, Globe, Cpu, Play } from 'lucide-react'
import FileBrowser from './FileBrowser'
import { getBaseUrl } from '../utils/api'

interface NewSessionOverlayProps {
  onClose: () => void
  onLaunch: (name: string, path: string, command: string) => void
}

export const NewSessionOverlay = ({ onClose, onLaunch }: NewSessionOverlayProps) => {
  const [selectedPath, setSelectedPath] = useState('')
  const [selectedCommand, setSelectedCommand] = useState('gemini --approval-mode yolo')
  const [repos, setRepos] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  const presets = [
    { id: 'gemini', name: 'Gemini CLI', cmd: 'gemini --approval-mode yolo', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
    { id: 'claude', name: 'Claude Code', cmd: 'claude-code', icon: Cpu, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
    { id: 'cursor', name: 'Cursor', cmd: 'cursor .', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
  ]

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/config`)
      .then(res => res.json())
      .then(data => setRepos(data.repos || []))
      .catch(err => console.error("Failed to fetch config:", err))

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleLaunch = () => {
    const repo = repos.find(r => r.path === selectedPath)
    const name = repo ? repo.name : (selectedPath.split('/').pop() || 'New Session')
    onLaunch(name, selectedPath, selectedCommand)
  }
  
  return (
    <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">New Agent Session</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-2 overflow-hidden">
        {/* Left Column: Context */}
        <div className="border-r border-slate-800 flex flex-col p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">1. Select Working Directory</h3>
          
          <div className="space-y-4 flex flex-col h-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Search repositories..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {repos.filter(r => r.name.toLowerCase().includes(filter.toLowerCase())).map(repo => (
                <div 
                  key={repo.id}
                  onClick={() => { setSelectedPath(repo.path); setShowFileBrowser(false); }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    selectedPath === repo.path 
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Folder className={`w-5 h-5 ${selectedPath === repo.path ? 'text-blue-400' : 'text-slate-600'}`} />
                    <div>
                      <p className="font-bold text-sm">{repo.name}</p>
                      <p className="text-[10px] font-mono opacity-50 truncate">{repo.path}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button 
                onClick={() => setShowFileBrowser(!showFileBrowser)}
                className="w-full py-3 rounded-xl border border-dashed border-slate-700 text-slate-500 text-xs font-bold uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                {showFileBrowser ? 'Hide File Browser' : 'Browse Local System'}
              </button>
            </div>

            {showFileBrowser && (
              <div className="h-64 border border-slate-800 rounded-xl overflow-hidden mt-2">
                <FileBrowser onSelectPath={(path) => setSelectedPath(path)} initialPath={selectedPath || '/'} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Agent */}
        <div className="flex flex-col p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">2. Configure Agent</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {presets.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedCommand(p.cmd)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    selectedCommand === p.cmd 
                      ? `${p.bg} ${p.border}` 
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${selectedCommand === p.cmd ? p.border : 'border-slate-800 bg-slate-800/50'}`}>
                      <p.icon className={`w-6 h-6 ${selectedCommand === p.cmd ? p.color : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <p className={`font-bold ${selectedCommand === p.cmd ? 'text-white' : 'text-slate-300'}`}>{p.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">{p.cmd}</p>
                    </div>
                  </div>
                  {selectedCommand === p.cmd && <div className={`w-2 h-2 rounded-full ${p.color.replace('text', 'bg')} shadow-[0_0_10px_currentColor]`}></div>}
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Custom Command</label>
              <div className="relative">
                <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-sm text-blue-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g. aider --gui"
                  value={selectedCommand}
                  onChange={e => setSelectedCommand(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-24 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md px-8 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ready to Launch</span>
          <p className="text-sm text-slate-300">
            Running <span className="text-blue-400 font-mono">{selectedCommand}</span> in <span className="text-slate-100 font-bold">{selectedPath || '...'}</span>
          </p>
        </div>
        <button 
          onClick={handleLaunch}
          disabled={!selectedPath || !selectedCommand}
          className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold flex items-center gap-3 shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98]"
        >
          <Play className="w-5 h-5 fill-current" />
          Launch Session
        </button>
      </footer>
    </div>
  )
}
