import { useState } from 'react'
import { Terminal as TerminalIcon, X, Layout, Maximize2, Ghost } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { TabContainer } from './components/TabContainer'

interface Tab {
  id: string
  name: string
  cwd: string
  active: boolean
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([])

  const openTab = (name: string, path: string) => {
    const id = Math.random().toString(36).substring(7)
    const newTabs = tabs.map(t => ({ ...t, active: false }))
    setTabs([...newTabs, { id, name, cwd: path, active: true }])
  }

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newTabs = tabs.filter(t => t.id !== id)
    if (newTabs.length > 0 && !newTabs.some(t => t.active)) {
      newTabs[newTabs.length - 1].active = true
    }
    setTabs(newTabs)
  }

  const setActive = (id: string) => {
    setTabs(tabs.map(t => ({ ...t, active: t.id === id })))
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <Sidebar onSelectRepo={(repo) => openTab(repo.name, repo.path)} />

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Tabs Bar */}
        <header className="flex bg-slate-900/40 border-b border-slate-800/60 overflow-x-auto min-h-[42px] no-scrollbar">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`group flex items-center gap-2 px-4 py-2 border-r border-slate-800/60 cursor-pointer text-xs font-medium transition-all relative min-w-[140px] max-w-[220px] ${
                tab.active 
                  ? 'bg-slate-950 text-blue-400' 
                  : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
              }`}
            >
              <TerminalIcon className={`w-3.5 h-3.5 ${tab.active ? 'text-blue-500' : 'text-slate-600 group-hover:text-slate-400'}`} />
              <span className="truncate flex-1">{tab.name}</span>
              <button 
                onClick={(e) => closeTab(tab.id, e)}
                className="p-1 rounded-md hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {tab.active && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500"></div>
              )}
            </div>
          ))}
          {tabs.length === 0 && (
            <div className="flex-1 flex items-center px-4 text-[10px] text-slate-600 uppercase font-bold tracking-widest opacity-50">
              Interactive Workspace
            </div>
          )}
        </header>

        {/* Content View */}
        <div className="flex-1 flex overflow-hidden relative">
          {tabs.length > 0 ? (
            tabs.filter(t => t.active).map(tab => (
              <TabContainer key={tab.id} cwd={tab.cwd} />
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 blur-[60px] rounded-full scale-150"></div>
                <div className="relative w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
                  <Layout className="w-10 h-10 text-slate-800" />
                  <Maximize2 className="absolute top-2 right-2 w-4 h-4 text-blue-500/40" />
                </div>
              </div>
              
              <div className="text-center max-w-sm space-y-2">
                <h2 className="text-xl font-bold text-slate-200 tracking-tight">Welcome to Overseer</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  The mission control for your Gemini CLI agents. Select a repository from the left to begin a new task.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-4">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 flex flex-col items-center text-center space-y-2">
                  <TerminalIcon className="w-5 h-5 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-400">Terminal Access</span>
                  <p className="text-[10px] text-slate-600 italic">Full interactive shell with PTY support</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 flex flex-col items-center text-center space-y-2">
                  <Ghost className="w-5 h-5 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-400">Task Isolation</span>
                  <p className="text-[10px] text-slate-600 italic">Safe sandboxing via Git worktrees</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
