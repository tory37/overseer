# App-wide UI Fixes and Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the AgentAvatar crash, resolve File Browser layout and scrolling issues, and enhance the New Session page with persona details.

**Architecture:**
- Fix prop name mismatch in `AgentAvatar`.
- Improve `Modal` and `FileBrowser` CSS for better scrolling and sizing.
- Update `NewSessionOverlay` to show persona title and instructions on demand.

**Tech Stack:** React, Tailwind CSS, Lucide React, Framer Motion

---

### Task 1: Fix AgentAvatar Prop Name Mismatch

**Files:**
- Modify: `frontend/src/components/NewSessionOverlay.tsx`
- Modify: `frontend/src/components/AgentAvatar.tsx` (Add optional className support)

- [ ] **Step 1: Update `NewSessionOverlay.tsx` to use `avatarConfig` prop**

```tsx
// frontend/src/components/NewSessionOverlay.tsx
// Find <AgentAvatar config={persona.avatarConfig} ... />
// Change to <AgentAvatar avatarConfig={persona.avatarConfig} ... />
```

- [ ] **Step 2: Update `AgentAvatar.tsx` to support `className` and fix prop type**

```tsx
// frontend/src/components/AgentAvatar.tsx
interface AgentAvatarProps {
  avatarConfig: AvatarConfig;
  state?: 'idle' | 'talking' | 'thinking';
  talkingUntil?: number;
  size?: number;
  className?: string; // Add this
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  avatarConfig,
  state = 'idle',
  talkingUntil = 0,
  size = 40,
  className = '', // Add this
}) => {
  // ...
  return (
    <motion.div
      // ...
      className={className} // Add this
      style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }}
    >
  // ...
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/NewSessionOverlay.tsx frontend/src/components/AgentAvatar.tsx
git commit -m "fix: resolve AgentAvatar crash and add className support"
```

---

### Task 2: Resolve Modal and File Browser Layout Issues

**Files:**
- Modify: `frontend/src/components/Modal.module.css`
- Modify: `frontend/src/components/Repositories.tsx`
- Modify: `frontend/src/components/FileBrowser.tsx`

- [ ] **Step 1: Improve Modal CSS for better scrolling**

```css
/* frontend/src/components/Modal.module.css */
.modalContent {
    /* ... existing */
    width: 600px; /* Give it a default width */
    min-height: 400px; /* Give it a min height */
}

.modalBody {
    flex: 1;
    overflow-y: auto; /* Allow scrolling if content is too large */
    display: flex;
    flex-direction: column;
}
```

- [ ] **Step 2: Update `Repositories.tsx` to ensure FileBrowser fits correctly**

```tsx
// frontend/src/components/Repositories.tsx
// In the Modal:
<div className="flex flex-col h-[500px]"> {/* Fixed height container for consistent modal size */}
  <div className="space-y-2 mb-4 flex-shrink-0">...</div>
  {/* ... */}
  <div className="flex-1 min-h-0 mb-4 border border-slate-700 rounded-lg overflow-hidden">
    <FileBrowser
      onPathChange={path => setNewRepo(prev => ({ ...prev, path }))}
      onSelectPath={path => setNewRepo(prev => ({ ...prev, path }))}
      initialPath={newRepo.path || '/'}
      showHeader={true} /* Show header to allow "Select Folder" button */
      title="Select Repository Path"
    />
  </div>
  {/* ... */}
</div>
```

- [ ] **Step 3: Update `FileBrowser.tsx` to handle `h-full` correctly**

```tsx
// frontend/src/components/FileBrowser.tsx
// Ensure the root div has min-h-0 to work correctly with flex-1 parents
<div className="flex flex-col h-full min-h-0 bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Modal.module.css frontend/src/components/Repositories.tsx frontend/src/components/FileBrowser.tsx
git commit -m "fix: improve Modal and FileBrowser layout and scrolling"
```

---

### Task 3: Enhance New Session Page Persona Details

**Files:**
- Modify: `frontend/src/components/NewSessionOverlay.tsx`

- [ ] **Step 1: Fix persona title and add info icon with toggleable description**

```tsx
// frontend/src/components/NewSessionOverlay.tsx
// 1. Add state for showing description: const [showPersonaInfo, setShowPersonaInfo] = useState<string | null>(null);
// 2. Update persona mapping to show title and info icon:
<div className="flex-1 min-w-0">
  <div className="flex items-center justify-between">
    <p className={`font-bold text-sm truncate ${selectedPersonaId === persona.id ? 'text-blue-400' : 'text-slate-300'}`}>
      {persona.name}
    </p>
    <div className="flex items-center gap-2">
      <button 
        onClick={(e) => { e.stopPropagation(); setShowPersonaInfo(showPersonaInfo === persona.id ? null : persona.id); }}
        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {selectedPersonaId === persona.id && <Check className="w-4 h-4 text-blue-500" />}
    </div>
  </div>
  <p className="text-[10px] text-slate-500 truncate">{persona.title}</p> {/* Use title instead of role */}
</div>

// 3. Add expandable description area:
{showPersonaInfo === persona.id && (
  <div className="mt-2 p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-[10px] text-slate-400 leading-relaxed animate-in slide-in-from-top-1 duration-200">
    {persona.instructions}
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/NewSessionOverlay.tsx
git commit -m "feat: enhance NewSessionOverlay with persona title and info toggle"
```

---

### Task 4: Final Verification

- [ ] **Step 1: Verify all changes manually**
- [ ] **Step 2: Run build to ensure no TS errors**

Run: `cd frontend && npm run build`
Expected: SUCCESS
