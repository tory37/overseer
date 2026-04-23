# New Agent Session Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full-screen "Blueprint" overlay for initiating new agent sessions with flexible repository/directory selection and AI CLI configuration.

**Architecture:** A new top-level state `isCreatingSession` in `App.tsx` will toggle the visibility of a `NewSessionOverlay` component. This component uses a two-column grid layout for "Context" (where to work) and "Agent" (what to run), integrating existing `FileBrowser` and backend APIs.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React (icons).

---

### Task 1: Update `App.tsx` State and Navigation

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add `isCreatingSession` state and toggle function**

Modify `App.tsx` to include the new state and a way to enter/exit the creation flow.

```tsx
// Around line 30, add state
const [isCreatingSession, setIsCreatingSession] = useState(false);

// Update openTab to handle closing the overlay if it was open
const openTab = (name: string, path: string, command?: string) => {
  const id = Math.random().toString(36).substring(7)
  const newTabs = tabs.map(t => ({ ...t, active: false }))
  setTabs([...newTabs, { id, name, cwd: path, command, active: true }])
  setIsCreatingSession(false) // Close overlay when a tab is opened
}
```

- [ ] **Step 2: Update the main rendering logic to show the overlay**

Wrap the main area content to conditionally show the overlay.

```tsx
// Inside the return of App(), replace the main content view area:
<div className="flex-1 flex overflow-hidden relative">
  {isCreatingSession ? (
    <NewSessionOverlay 
      onClose={() => setIsCreatingSession(false)}
      onLaunch={(name, path, command) => openTab(name, path, command)}
    />
  ) : activeTab ? (
    <TabContainer key={activeTab.id} cwd={activeTab.cwd} command={activeTab.command} />
  ) : selectedRepo ? (
    // ... existing repo view ...
  ) : (
    // ... existing welcome view ...
  )}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: add isCreatingSession state and overlay toggle in App"
```

---

### Task 2: Create `NewSessionOverlay` Skeleton

**Files:**
- Create: `frontend/src/components/NewSessionOverlay.tsx`

- [ ] **Step 1: Create the basic component structure with two columns**

```tsx
import React, { useState, useEffect } from 'react'
import { X, Plus, Terminal, Search, Folder, Zap, Globe, Cpu, Play } from 'lucide-react'

interface NewSessionOverlayProps {
  onClose: () => void
  onLaunch: (name: string, path: string, command: string) => void
}

export const NewSessionOverlay = ({ onClose, onLaunch }: NewSessionOverlayProps) => {
  const [selectedPath, setSelectedPath] = useState('')
  const [selectedCommand, setSelectedCommand] = useState('gemini --approval-mode yolo')
  
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
          {/* Placeholder for Repo List / File Browser */}
          <div className="flex-1 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-center p-8">
            <p className="text-slate-600">Context Selection Area</p>
          </div>
        </div>

        {/* Right Column: Agent */}
        <div className="flex flex-col p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">2. Configure Agent</h3>
          {/* Placeholder for CLI selection */}
          <div className="flex-1 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-center p-8">
            <p className="text-slate-600">Agent Configuration Area</p>
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
          onClick={() => onLaunch('New Session', selectedPath, selectedCommand)}
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
