import { useState } from 'react'
import { Terminal as TerminalIcon, X, Layout, Maximize2, Ghost, Rocket, Check, GitBranch, Info, Plus, Trash2, Folder, Home } from 'lucide-react' // Added Folder and Home icons
import { Sidebar } from './components/Sidebar'
import { TabContainer } from './components/TabContainer'

interface Repo {
  id: string
  name: string
  path: string
  group_id?: string
}

interface Tab {
  id: string
  name: string
  cwd: string
  command?: string
  active: boolean
}

// Utility to get the base API URL
export const getBaseUrl = () => {
  // Use relative URLs and let Vite proxy handle it during development,
  // or use relative URLs in production (same host).
  return '';
};

function App() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const openTab = (name: string, path: string, command?: string) => {
    const id = Math.random().toString(36).substring(7)
    const newTabs = tabs.map(t => ({ ...t, active: false }))
    setTabs([...newTabs, { id, name, cwd: path, command, active: true }])
  }

  const handleStartTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskName || !selectedRepo) return

    setIsCreating(true)
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/worktrees?repo_id=${selectedRepo.id}&task_name=${encodeURIComponent(taskName)}`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.status === 'ok') {
        openTab(`${selectedRepo.name}: ${taskName}`, data.path, 'gemini --approval-mode yolo')
        setShowTaskModal(false)
        setTaskName('')
      }
 else {
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

  const activeTab = tabs.find(t => t.active)

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      <Sidebar onSelectRepo={(repo) => {
        setSelectedRepo(repo)
        setTabs(tabs.map(t => ({ ...t, active: false })))
      }} />

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,41,59,0.2),transparent)]">
        {/* Tabs Bar */}
        <header className="flex bg-slate-900/40 border-b border-slate-800/60 overflow-x-auto min-h-[42px] no-scrollbar">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`group flex items-center gap-2 px-4 py-2 border-r border-slate-800/60 cursor-pointer text-xs font-medium transition-all relative min-w-[140px] max-w-[220px] ${
                tab.active 
                  ? 'bg-slate-950/50 text-blue-400' 
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
          {tabs.length > 0 && (
            <div 
              onClick={() => setTabs(tabs.map(t => ({ ...t, active: false })))}
              className={`flex items-center px-4 border-r border-slate-800/60 cursor-pointer transition-all hover:bg-slate-800/40 ${!activeTab ? 'bg-slate-950/50 text-blue-400' : 'text-slate-500'}`}
            >
              <Layout className="w-3.5 h-3.5" />
            </div>
          )}
          {tabs.length === 0 && (
            <div className="flex-1 flex items-center px-4 text-[10px] text-slate-600 uppercase font-bold tracking-widest opacity-50">
              Interactive Workspace
            </div>
          )}
        </header>

        {/* Content View */}
        <div className="flex-1 flex overflow-hidden relative">
          {activeTab ? (
            <TabContainer key={activeTab.id} cwd={activeTab.cwd} command={activeTab.command} />
          ) : selectedRepo ? (
            <div className="flex-1 flex flex-col p-12 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/10">
                    <Folder className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-1">{selectedRepo.name}</h2>
                    <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                      <Home className="w-3 h-3" />
                      <span>{selectedRepo.path}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Launch New Agent
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Agents List (Placeholder for now) */}
                <div className="col-span-full mb-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Active Agents</h3>
                </div>
                
                {tabs.filter(t => t.name.startsWith(selectedRepo.name)).map(tab => (
                  <div 
                    key={tab.id}
                    onClick={() => setActive(tab.id)}
                    className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                        <TerminalIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-400" />
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-green-500 uppercase">Running</span>
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-slate-200 mb-1 truncate">{tab.name.split(': ')[1]}</h4>
                    <p className="text-[10px] text-slate-500 font-mono truncate mb-6">{tab.cwd}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                      <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">Resume Session</button>
                      <button 
                        onClick={(e) => closeTab(tab.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {tabs.filter(t => t.name.startsWith(selectedRepo.name)).length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
                    <Rocket className="w-12 h-12 text-slate-800 mb-4" />
                    <p className="text-slate-500 font-medium">No active agents for this repository</p>
                    <button 
                      onClick={() => setShowTaskModal(true)}
                      className="mt-4 text-xs text-blue-500 font-bold uppercase tracking-widest hover:text-blue-400"
                    >
                      Start your first task
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-20 animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
                  <TerminalIcon className="w-12 h-12 text-blue-500" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Welcome to Overseer</h2>
              <p className="text-slate-500 max-w-md mb-10 leading-relaxed font-medium">
                Your unified interface for managing multiple agent environments. Select a repository from the sidebar to initialize a task.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 flex flex-col items-center gap-3 transition-all hover:border-slate-700">
                  <Layout className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-400">Multi-Tab UI</span>
                  <p className="text-[10px] text-slate-600 italic">Work on multiple agents in parallel</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 flex flex-col items-center gap-3 transition-all hover:border-slate-700">
                  <Maximize2 className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-400">Integrated PTY</span>
                  <p className="text-[10px] text-slate-600 italic">Native terminal performance</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 flex flex-col items-center gap-3 transition-all hover:border-slate-700">
                  <Ghost className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-400">Task Isolation</span>
                  <p className="text-[10px] text-slate-600 italic">Safe sandboxing via Git worktrees</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Task Initiation Modal */}
      {showTaskModal && selectedRepo && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-[0_30px_100px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                  <Rocket className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Initialize New Task</h3>
                  <p className="text-xs text-slate-500 font-medium tracking-wide">Launch an isolated agent environment</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTaskModal(false)} 
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleStartTask} className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left side: Form */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Target Repository</label>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-inner">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <GitBranch className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-200">{selectedRepo.name}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Task Identifier</label>
                    <input 
                      autoFocus
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all placeholder:text-slate-700 shadow-inner"
                      placeholder="e.g. fix-auth-logic"
                      value={taskName}
                      onChange={e => setTaskName(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-600 font-medium px-1">Use a short, descriptive slug for the worktree directory name.</p>
                  </div>
                </div>

                {/* Right side: Explanation */}
                <div className="w-full md:w-64 space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Info className="w-4 h-4 text-orange-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">How it works</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Overseer uses <span className="text-slate-300 font-semibold">Git worktrees</span> to create a separate directory for this task. 
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                        <p className="text-[10px] text-slate-400">Zero main-tree pollution</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                        <p className="text-[10px] text-slate-400">Parallel task execution</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                        <p className="text-[10px] text-slate-400">Fast environment setup</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-400 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!taskName || isCreating}
                  className="flex-[2] px-6 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-white shadow-xl shadow-orange-900/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Initializing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Start Agent Task</span>
                    </>
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
