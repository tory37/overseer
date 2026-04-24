# Persona Studio & Special Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote Persona Lab to a full-screen "Studio" and unify sidebar actions into a singleton tab system.

**Architecture:** Refactor the `Tab` interface in `App.tsx` to support multiple types (`agent`, `persona-lab`, `config`, `search`). Implement a singleton routing mechanism to ensure only one instance of each "Special Tab" exists. Create a new `PersonaStudio.tsx` for the full-screen experience.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React (icons).

---

### Task 1: Refactor Tab Interface and Routing in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Update the `Tab` interface**

```typescript
type TabType = 'agent' | 'persona-lab' | 'config' | 'search';

interface Tab {
  id: string;
  type: TabType; // Add type
  name: string;
  cwd?: string;
  command?: string;
  personaId?: string | null;
  active: boolean;
}
```

- [ ] **Step 2: Update `openTab` and add `openSpecialTab`**

```typescript
  const openTab = async (name: string, path: string, command?: string, personaId: string | null = null) => {
    try {
      const session = await createSession(name, path, command || '', personaId, 30, 120);
      const id = session.id;
      const newTabs = tabs.map(t => ({ ...t, active: false }))
      setTabs([...newTabs, { id, type: 'agent', name, cwd: path, command, personaId, active: true }])
      setIsCreatingSession(false)
      setIsLoaded(true)
    } catch (err) {
      console.error("Failed to create session:", err);
      const id = Math.random().toString(36).substring(7)
      const newTabs = tabs.map(t => ({ ...t, active: false }))
      setTabs([...newTabs, { id, type: 'agent', name, cwd: path, command, personaId, active: true }])
      setIsCreatingSession(false)
      setIsLoaded(true)
    }
  }

  const openSpecialTab = (type: TabType) => {
    const existing = tabs.find(t => t.type === type);
    if (existing) {
      setActive(existing.id);
      return;
    }

    const id = `special-${type}`;
    let name = '';
    switch (type) {
      case 'persona-lab': name = 'Persona Studio'; break;
      case 'config': name = 'Configuration'; break;
      case 'search': name = 'Global Search'; break;
    }

    const newTabs = tabs.map(t => ({ ...t, active: false }));
    setTabs([...newTabs, { id, type, name, active: true }]);
  };
```

- [ ] **Step 3: Update `Sidebar` props and usage**

```typescript
      <Sidebar 
        onSelectRepo={(repo) => {
          setSelectedRepo(repo)
          setTabs(tabs.map(t => ({ ...t, active: false })))
        }} 
        onNewSession={() => setIsCreatingSession(true)}
        onOpenSpecialTab={openSpecialTab} // Pass the new handler
      />
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "refactor: generalize Tab interface and add openSpecialTab"
```

### Task 2: Update Sidebar with Footer Actions

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Update `SidebarProps`**

```typescript
interface SidebarProps {
  onSelectRepo: (repo: Repo) => void
  onNewSession: () => void
  onOpenSpecialTab: (type: 'persona-lab' | 'config' | 'search') => void
}
```

- [ ] **Step 2: Update Footer Actions**

```typescript
      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-800/60 bg-slate-950/40 space-y-1">
        <button 
          onClick={() => onOpenSpecialTab('persona-lab')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Ghost className="w-4 h-4" />
          <span>Persona Lab</span>
        </button>
        <button 
          onClick={() => onOpenSpecialTab('search')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Global Search</span>
        </button>
        <button 
          onClick={() => onOpenSpecialTab('config')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Configuration</span>
        </button>
      </div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Sidebar.tsx
git commit -m "feat: add Persona Lab to sidebar footer and connect special tabs"
```

### Task 3: Create PersonaStudio Component

**Files:**
- Create: `frontend/src/components/PersonaStudio.tsx`

- [ ] **Step 1: Implement PersonaStudio with two-column layout**

```typescript
import React, { useState, useEffect } from 'react';
import { Ghost, Plus, Search, User, Edit3, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { getPersonas, createPersona, deletePersona, type Persona } from '../utils/api';

interface PersonaStudioProps {
  onPersonaCreated?: () => void;
}

export const PersonaStudio: React.FC<PersonaStudioProps> = ({ onPersonaCreated }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Persona>({ id: '', name: '', instructions: '', avatarId: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refresh = async () => {
    try {
      const data = await getPersonas();
      setPersonas(data);
    } catch (err) {
      console.error("Failed to fetch personas:", err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreateNew = () => {
    setSelectedPersona(null);
    setFormData({ id: '', name: '', instructions: '', avatarId: '' });
    setIsEditing(true);
    setMessage(null);
  };

  const handleSelect = (p: Persona) => {
    setSelectedPersona(p);
    setFormData(p);
    setIsEditing(false);
    setMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!formData.id || !formData.name || !formData.instructions || !formData.avatarId) {
        throw new Error('All fields are required.');
      }

      await createPersona(formData);
      setMessage({ type: 'success', text: isEditing && selectedPersona ? 'Persona updated!' : 'Persona created!' });
      refresh();
      if (onPersonaCreated) onPersonaCreated();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save persona.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredPersonas = personas.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-slate-950 overflow-hidden">
      {/* Sidebar - Persona List */}
      <div className="w-80 border-r border-slate-900 flex flex-col bg-slate-900/20">
        <div className="p-4 border-b border-slate-900 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Ghost className="w-5 h-5 text-blue-500" />
              Studio
            </h2>
            <button 
              onClick={handleCreateNew}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search personas..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredPersonas.map(p => (
            <div 
              key={p.id}
              onClick={() => handleSelect(p)}
              className={`p-3 rounded-xl cursor-pointer transition-all border ${
                selectedPersona?.id === p.id 
                  ? 'bg-blue-600/10 border-blue-500/50 text-white' 
                  : 'border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                   <img src={`/assets/avatars/${p.avatarId}.svg`} alt="" className="w-8 h-8" onError={(e) => {
                     (e.target as any).src = '/assets/avatars/overseer.svg'
                   }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{p.name}</div>
                  <div className="text-[10px] opacity-50 font-mono truncate">{p.id}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(30,41,59,0.2),transparent)]">
        {(selectedPersona || isEditing) ? (
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-12">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                    {isEditing && !selectedPersona ? 'Create New Persona' : formData.name}
                  </h1>
                  <p className="text-slate-500 font-medium">Configure the identity and behavior of your AI agents.</p>
                </div>
                {selectedPersona && !isEditing && (
                   <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white transition-all flex items-center gap-2"
                   >
                     <Edit3 className="w-4 h-4" />
                     Edit Persona
                   </button>
                )}
              </header>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Identifier (ID)</label>
                    <input 
                      name="id"
                      disabled={!!selectedPersona && !isEditing}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                      value={formData.id}
                      onChange={handleChange}
                      placeholder="e.g. bug-hunter"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Display Name</label>
                    <input 
                      name="name"
                      disabled={!isEditing}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Bug Hunter"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Avatar ID</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                       <img src={`/assets/avatars/${formData.avatarId}.svg`} alt="" className="w-12 h-12" onError={(e) => {
                         (e.target as any).src = '/assets/avatars/overseer.svg'
                       }}/>
                    </div>
                    <input 
                      name="avatarId"
                      disabled={!isEditing}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                      value={formData.avatarId}
                      onChange={handleChange}
                      placeholder="e.g. robot-1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">System Instructions</label>
                  <textarea 
                    name="instructions"
                    disabled={!isEditing}
                    rows={12}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono disabled:opacity-50"
                    value={formData.instructions}
                    onChange={handleChange}
                    placeholder="Describe how the agent should behave..."
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xl shadow-blue-900/20 flex items-center gap-2"
                    >
                      {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                      Save Changes
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        if (selectedPersona) setFormData(selectedPersona);
                        else setSelectedPersona(null);
                      }}
                      className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>

              {message && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
              <Ghost className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Persona Studio</h3>
            <p className="text-slate-500 max-w-sm mb-8">Select a persona from the gallery or create a new one to begin designing your AI agents.</p>
            <button 
              onClick={handleCreateNew}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white transition-all shadow-xl shadow-blue-900/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Persona
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/PersonaStudio.tsx
git commit -m "feat: implement full-screen PersonaStudio component"
```

### Task 4: Connect Special Tabs in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Import PersonaStudio and add dispatcher**

```typescript
import { PersonaStudio } from './components/PersonaStudio'

// Inside App component return, replace the activeTab conditional rendering:

        <div className="flex-1 flex overflow-hidden relative">
          {isCreatingSession ? (
            <NewSessionOverlay 
              personas={personas}
              onClose={() => setIsCreatingSession(false)}
              onLaunch={(name, path, command, personaId) => openTab(name, path, command, personaId)}
            />
          ) : activeTab ? (
            <>
              {activeTab.type === 'agent' && (
                <TabContainer 
                  key={activeTab.id} 
                  id={activeTab.id} 
                  cwd={activeTab.cwd} 
                  command={activeTab.command} 
                  personaId={activeTab.personaId} 
                  personas={personas}
                  onPersonaCreated={() => getPersonas().then(setPersonas)}
                />
              )}
              {activeTab.type === 'persona-lab' && (
                <PersonaStudio 
                  onPersonaCreated={() => getPersonas().then(setPersonas)}
                />
              )}
              {activeTab.type === 'config' && (
                <div className="flex-1 flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">
                  Configuration (Coming Soon)
                </div>
              )}
              {activeTab.type === 'search' && (
                <div className="flex-1 flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">
                  Global Search (Coming Soon)
                </div>
              )}
            </>
          ) : selectedRepo ? (
            // ... existing repository view ...
          ) : (
            // ... existing welcome view ...
          )
        }
```

- [ ] **Step 2: Update Tab Item Icon in Header**

```typescript
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
              {tab.type === 'agent' && <TerminalIcon className={`w-3.5 h-3.5 ${tab.active ? 'text-blue-500' : 'text-slate-600 group-hover:text-slate-400'}`} />}
              {tab.type === 'persona-lab' && <Ghost className={`w-3.5 h-3.5 ${tab.active ? 'text-blue-500' : 'text-slate-600 group-hover:text-slate-400'}`} />}
              {tab.type === 'config' && <Settings className={`w-3.5 h-3.5 ${tab.active ? 'text-blue-500' : 'text-slate-600 group-hover:text-slate-400'}`} />}
              {tab.type === 'search' && <Search className={`w-3.5 h-3.5 ${tab.active ? 'text-blue-500' : 'text-slate-600 group-hover:text-slate-400'}`} />}
              
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
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: connect PersonaStudio and special tabs in main area"
```

### Task 5: Cleanup UtilityPane

**Files:**
- Modify: `frontend/src/components/UtilityPane.tsx`

- [ ] **Step 1: Remove Persona Lab mode and imports**

```typescript
// Remove: import { PersonaLab } from './PersonaLab'

// Update mode type
const [mode, setMode] = useState<'SHELL' | 'GIT' | 'INSPECTOR'>('GIT')

// Remove Persona Lab from the button list in JSX
        {[
          { id: 'GIT', icon: GitBranch, label: 'Git' },
          { id: 'INSPECTOR', icon: Info, label: 'Inspector' },
          { id: 'SHELL', icon: Shell, label: 'Shell' },
        ].map((item) => ( ... ))}

// Remove Persona Lab condition from content area
// {mode === 'PERSONA_LAB' && <PersonaLab onCreated={onPersonaCreated} />}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/UtilityPane.tsx
git commit -m "cleanup: remove Persona Lab from UtilityPane"
```

### Task 6: Final Verification

- [ ] **Step 1: Verify Persona Studio singleton**
- [ ] **Step 2: Verify Configuration singleton**
- [ ] **Step 3: Verify Global Search singleton**
- [ ] **Step 4: Verify agent tabs still work correctly**
- [ ] **Step 5: Verify Persona creation in Studio works and updates active agents**
