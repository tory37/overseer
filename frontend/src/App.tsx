import { useState } from 'react'
import { Folder, HardDrive, Terminal as TerminalIcon, Search, Settings, Plus } from 'lucide-react'
import { Terminal } from './components/Terminal'

function App() {
  const [tabs] = useState([
    { id: 1, name: 'Fix Auth Bug', active: true },
    { id: 2, name: 'Add Refactor', active: false },
  ])

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
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
              <div className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm">
                <Folder className="w-4 h-4 text-slate-400" />
                <span>Active</span>
              </div>
              <div className="flex items-center gap-2 p-2 pl-6 rounded hover:bg-slate-800 cursor-pointer text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>agent-manager</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer text-sm">
                <Folder className="w-4 h-4 text-slate-400" />
                <span>Side Projects</span>
              </div>
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

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Tabs Bar */}
        <header className="flex bg-slate-900 border-b border-slate-800 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 border-r border-slate-800 cursor-pointer text-sm min-w-[140px] ${
                tab.active ? 'bg-slate-950 border-t-2 border-t-blue-500' : 'hover:bg-slate-800'
              }`}
            >
              <TerminalIcon className="w-3 h-3 text-slate-400" />
              <span className="truncate">{tab.name}</span>
            </div>
          ))}
          <div className="p-2 flex items-center justify-center hover:bg-slate-800 cursor-pointer">
            <Plus className="w-4 h-4 text-slate-500" />
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Terminal Pane */}
          <div className="flex-1 min-w-0 border-r border-slate-800">
            <Terminal onData={(data) => console.log('Terminal Input:', data)} />
          </div>

          {/* Utility Pane (Placeholder) */}
          <div className="w-[400px] bg-slate-950 flex flex-col">
            <div className="p-2 border-b border-slate-800 flex gap-2">
              <button className="px-3 py-1 bg-slate-800 rounded text-xs font-medium text-blue-400">SHELL</button>
              <button className="px-3 py-1 hover:bg-slate-800 rounded text-xs font-medium text-slate-400">GIT</button>
              <button className="px-3 py-1 hover:bg-slate-800 rounded text-xs font-medium text-slate-400">INSPECTOR</button>
            </div>
            <div className="flex-1 p-4 font-mono text-xs text-slate-500">
              $ git status<br />
              On branch main<br />
              Your branch is up to date with 'origin/main'.<br />
              <br />
              nothing to commit, working tree clean
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
