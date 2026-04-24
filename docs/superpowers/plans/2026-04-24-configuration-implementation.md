# Configuration View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a global Configuration settings view and integrate a persistent toggle for persona-based viewing.

**Architecture:** New React component `Configuration` with routing integration in `App.tsx` and persistence via `useViewMode`.

**Tech Stack:** React, TypeScript, Vite.

---

### Task 1: Create Configuration Component

**Files:**
- Create: `frontend/src/components/Configuration.tsx`

- [ ] **Step 1: Create the Configuration component skeleton**

```tsx
import React from 'react';
import { useViewMode } from '../utils/useViewMode';

export const Configuration: React.FC = () => {
  const { isPersonaView, toggleViewMode } = useViewMode();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Configuration</h2>
      <div className="flex items-center justify-between p-4 border rounded">
        <span>Persona-based View</span>
        <button
          onClick={toggleViewMode}
          className={`px-4 py-2 rounded ${
            isPersonaView ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          {isPersonaView ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Configuration.tsx
git commit -m "feat: add Configuration component with view mode toggle"
```

### Task 2: Update App Routing

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Replace placeholder route with Configuration component**

```tsx
// Inside App.tsx, update the Routes section
import { Configuration } from './components/Configuration';

// ...
<Route path="/config" element={<Configuration />} />
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: integrate Configuration component into routes"
```

---
