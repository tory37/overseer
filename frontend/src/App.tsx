import { useState } from 'react'
import { Terminal as TerminalIcon, X } from 'lucide-react'
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
      <main className="flex-1 flex flex-col min-w-0">
        {/* Tabs Bar */}
        <header className="flex bg-slate-900 border-b border-slate-800 overflow-x-auto min-h-[40px]">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`group flex items-center gap-2 px-4 py-2 border-r border-slate-800 cursor-pointer text-sm min-w-[140px] max-w-[200px] ${
                tab.active ? 'bg-slate-950 border-t-2 border-t-blue-500' : 'hover:bg-slate-800'
              }`}
            >
              <TerminalIcon className={`w-3 h-3 ${tab.active ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="truncate flex-1">{tab.name}</span>
              <X 
                className="w-3 h-3 text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" 
                onClick={(e) => closeTab(tab.id, e)}
              />
            </div>
          ))}
          {tabs.length === 0 && (
            <div className="flex-1 flex items-center px-4 text-xs text-slate-500 italic">
              Select a repository from the sidebar to start
            </div>
          )}
        </header>

        {/* Content View */}
        <div className="flex-1 flex overflow-hidden">
          {tabs.length > 0 ? (
            tabs.filter(t => t.active).map(tab => (
              <TabContainer key={tab.id} cwd={tab.cwd} />
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                <TerminalIcon className="w-8 h-8 text-slate-700" />
              </div>
              <div className="text-center">
                <h2 className="text-slate-300 font-medium">No Tasks Active</h2>
                <p className="text-sm text-slate-500 mt-1">Select a repository to get started.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
