import { useState, useEffect } from 'react'
import { Shell, GitBranch, Info, Activity, RefreshCw, Ghost } from 'lucide-react'
import { getBaseUrl } from '../utils/api'
import { Terminal } from './Terminal'
import { PersonaLab } from './PersonaLab'

interface UtilityPaneProps {
  id: string
  cwd?: string
  onVoiceMessage?: (message: string) => void
  onActivity?: (isWorking: boolean) => void
  onPersonaCreated?: () => void
}

export const UtilityPane = ({ id, cwd, onVoiceMessage, onActivity, onPersonaCreated }: UtilityPaneProps) => {
  type UtilityMode = 'SHELL' | 'GIT' | 'INSPECTOR' | 'LAB';
  const [mode, setMode] = useState<UtilityMode>('GIT')
  const [gitStatus, setGitStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const utilitySessionId = `utility-${id}`

  const fetchGitStatus = async () => {
    if (!cwd) return
    setLoading(true)
    try {
      const res = await fetch(`${getBaseUrl()}/api/git/status?cwd=${encodeURIComponent(cwd)}`)
      const data = await res.json()
      if (data.status === 'ok') {
        setGitStatus(data.output)
      } else {
        setGitStatus(`Error: ${data.message}`)
      }
    } catch (err) {
      setGitStatus('Failed to fetch git status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGitStatus()
  }, [cwd])

  return (
    <div className="flex flex-col h-full bg-slate-900/20">
      {/* Mode Switcher */}
      <div className="flex bg-slate-950/80 border-b border-slate-800/60 p-1 gap-1">
        {[
          { id: 'GIT' as UtilityMode, icon: GitBranch, label: 'Git' },
          { id: 'INSPECTOR' as UtilityMode, icon: Info, label: 'Inspector' },
          { id: 'SHELL' as UtilityMode, icon: Shell, label: 'Shell' },
          { id: 'LAB' as UtilityMode, icon: Ghost, label: 'Lab' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              mode === item.id 
                ? 'bg-blue-600/10 text-blue-400 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <item.icon className={`w-3.5 h-3.5 ${mode === item.id ? 'text-blue-400' : 'text-slate-600'}`} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {mode === 'INSPECTOR' && (
          <div className="p-5 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Activity className="w-4 h-4 text-blue-500/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Status</span>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Context Directory</span>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 truncate ml-4">
                    {cwd || 'Initializing...'}
                  </span>
                </div>
                <div className="h-px bg-slate-800/50"></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">PTY Status</span>
                    <span className="text-green-500 font-bold flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      CONNECTED
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Agent Status</span>
                    <span className="text-slate-400 font-bold">READY</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">AI Insights</div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/5 to-transparent border border-blue-500/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full translate-x-12 -translate-y-12"></div>
                <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                  The agent is currently monitoring the filesystem for changes. Worktree isolation is active, ensuring your main branch remains stable during this session.
                </p>
              </div>
            </div>
          </div>
        )}

        {mode === 'GIT' && (
          <div className="p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-500">
                <GitBranch className="w-4 h-4 text-blue-500/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Git Status</span>
              </div>
              <button 
                onClick={fetchGitStatus}
                className={`p-1 rounded hover:bg-slate-800 text-slate-500 transition-all ${loading ? 'animate-spin text-blue-500' : ''}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] overflow-auto whitespace-pre no-scrollbar">
              {gitStatus || 'No status data available'}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-relaxed">
                Worktree isolated. You can commit safely without affecting your main checkout.
              </p>
            </div>
          </div>
        )}

        {mode === 'LAB' && (
          <PersonaLab onCreated={onPersonaCreated} />
        )}

        {mode === 'SHELL' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
              <Terminal 
                id={utilitySessionId} 
                cwd={cwd} 
                command="/bin/bash" 
                onVoiceMessage={onVoiceMessage}
                onActivity={onActivity}
              />
            </div>
            <div className="bg-slate-950 border-t border-slate-800 p-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-2">
                <Shell className="w-3 h-3 text-blue-500" />
                UTILITY_SESSION: {utilitySessionId}
              </span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {cwd}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
