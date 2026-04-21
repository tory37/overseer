import { useState } from 'react'
import { Terminal } from './Terminal'

interface UtilityPaneProps {
  cwd?: string
}

export const UtilityPane = ({ cwd }: UtilityPaneProps) => {
  const [mode, setMode] = useState<'shell' | 'git' | 'inspector'>('shell')

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800">
      <div className="p-2 border-b border-slate-800 flex gap-1">
        <button 
          onClick={() => setMode('shell')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            mode === 'shell' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          SHELL
        </button>
        <button 
          onClick={() => setMode('git')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            mode === 'git' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          GIT
        </button>
        <button 
          onClick={() => setMode('inspector')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            mode === 'inspector' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          INSPECTOR
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {mode === 'shell' && (
          <Terminal cwd={cwd} />
        )}
        {mode === 'git' && (
          <div className="p-4 font-mono text-xs text-slate-400 space-y-2">
            <div className="text-slate-500 italic uppercase text-[10px] tracking-widest mb-2">Git Status</div>
            <div>On branch <span className="text-blue-400 font-bold">main</span></div>
            <div>Your branch is up to date with 'origin/main'.</div>
            <div className="mt-4 text-slate-500">nothing to commit, working tree clean</div>
          </div>
        )}
        {mode === 'inspector' && (
          <div className="p-4 font-mono text-xs text-slate-400 space-y-4">
            <div className="text-slate-500 italic uppercase text-[10px] tracking-widest mb-2">Project Inspector</div>
            <div className="bg-slate-900 p-3 border border-slate-800 rounded">
              <div className="text-blue-400 mb-1 font-bold">AI Summary</div>
              <p className="text-slate-300 leading-relaxed">
                This project is the Overseer UI. 
                Infrastructure for PTY and Git Worktrees is complete.
                Currently working on Task 6: UI Polish and Split Panes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
