import { useState } from 'react'
import { Terminal as TerminalIcon, X, Layout, Maximize2, Ghost, Rocket } from 'lucide-react'
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
  const [showTaskModal, setShowTaskModal] = useState<{repoId: string, repoName: string} | null>(null)
  const [taskName, setTaskName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const openTab = (name: string, path: string) => {
    const id = Math.random().toString(36).substring(7)
    const newTabs = tabs.map(t => ({ ...t, active: false }))
    setTabs([...newTabs, { id, name, cwd: path, active: true }])
  }

  const handleStartTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskName || !showTaskModal) return

    setIsCreating(true)
    try {
      const res = await fetch(`http://localhost:8000/api/worktrees?repo_id=${showTaskModal.repoId}&task_name=${encodeURIComponent(taskName)}`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.status === 'ok') {
        openTab(`${showTaskModal.repoName}: ${taskName}`, data.path)
        setShowTaskModal(null)
        setTaskName('')
      } else {
        alert(data.error || "Failed to create task environment")
      }
    } catch (err) {
      console.error("Task creation error:", err)
    } finally {
      setIsCreating(false)
    }
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
      <Sidebar onSelectRepo={(repo) => setShowTaskModal({ repoId: repo.id, repoName: repo.name })} />

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

      {/* Task Initiation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-slate-100">Initialize New Task</h3>
              </div>
              <button 
                onClick={() => setShowTaskModal(null)} 
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleStartTask} className="p-6 space-y-5">
              <div className="bg-blue-600/5 border border-blue-500/10 rounded-xl p-3">
                <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Target Repository</p>
                <p className="text-sm text-slate-300 font-medium">{showTaskModal.repoName}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Task Name / Description</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-500 transition-all placeholder:text-slate-700"
                  placeholder="e.g. fix-auth-logic"
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                />
              </div>
              
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                <div className="flex items-start gap-2">
                  <Ghost className="w-3.5 h-3.5 text-slate-600 mt-0.5" />
                  <p className="text-[10px] text-slate-500 leading-tight">
                    This will create a dedicated <span className="text-slate-300">Git worktree</span> for this task. 
                    Changes won't affect your main directory until you're ready.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowTaskModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-300 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!taskName || isCreating}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-lg shadow-orange-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Start Task</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
