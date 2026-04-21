import { useState } from 'react'
import { Terminal as TerminalIcon, Plus } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { TabContainer } from './components/TabContainer'

function App() {
  const [tabs] = useState([
    { id: 1, name: 'Fix Auth Bug', active: true, cwd: '/home/toryhebert/src/agent-manager' },
    { id: 2, name: 'Add Refactor', active: false, cwd: '/home/toryhebert/src/agent-manager' },
  ])

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <Sidebar />

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
          {tabs.filter(t => t.active).map(tab => (
            <TabContainer key={tab.id} cwd={tab.cwd} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
