# Persona-Based View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a new, toggleable, persona-based secondary view for organizing and navigating agent sessions.

**Architecture:** Introduce `react-router-dom` to manage two distinct layouts: the existing tab-based view and a new persona-based view. A custom hook will manage the view mode preference, persisting it to `localStorage`. New components will be created for the persona layout and its specific UI elements.

**Tech Stack:** React, TypeScript, `react-router-dom`, Python (FastAPI backend)

---

### Task 1: Project Setup

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Install dependencies**

  I will add `react-router-dom` and its TypeScript definitions to the frontend dependencies.

  ```bash
  npm install react-router-dom @types/react-router-dom --prefix frontend
  ```

- [ ] **Step 2: Commit dependency changes**

  ```bash
  git add frontend/package.json frontend/package-lock.json
  git commit -m "feat(frontend): add react-router-dom dependency"
  ```

- [ ] **Step 3: Integrate BrowserRouter**

  Wrap the `App` component in `BrowserRouter` to enable routing capabilities throughout the application.

  ```typescript
  // In frontend/src/main.tsx
  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import { BrowserRouter } from 'react-router-dom'
  import App from './App.tsx'
  import './index.css'

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
  ```

- [ ] **Step 4: Commit router integration**
  
  ```bash
  git add frontend/src/main.tsx
  git commit -m "refactor(frontend): integrate BrowserRouter into main app entrypoint"
  ```

---

### Task 2: Create View Mode Hook

**Files:**
- Create: `frontend/src/utils/useViewMode.ts`
- Test: `frontend/src/utils/useViewMode.test.ts` (Note: This is a new test file, we'll need a test runner setup if not present)

- [ ] **Step 1: Write the hook logic**

  This hook will manage the view mode state and persist it to `localStorage`.

  ```typescript
  // In frontend/src/utils/useViewMode.ts
  import { useState, useEffect } from 'react';
  import { useNavigate, useLocation } from 'react-router-dom';

  export type ViewMode = 'tabs' | 'persona';

  const useViewMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
      return (localStorage.getItem('viewMode') as ViewMode) || 'tabs';
    });

    useEffect(() => {
      localStorage.setItem('viewMode', viewMode);
      const targetPath = viewMode === 'tabs' ? '/' : '/persona';
      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    }, [viewMode, navigate, location.pathname]);

    return [viewMode, setViewMode] as const;
  };

  export default useViewMode;
  ```

- [ ] **Step 2: Commit the hook**

  ```bash
  git add frontend/src/utils/useViewMode.ts
  git commit -m "feat(frontend): create useViewMode hook for managing UI layout"
  ```

---

### Task 3: Create Layout Components

**Files:**
- Create: `frontend/src/components/TabLayout.tsx`
- Create: `frontend/src/components/PersonaLayout.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create TabLayout component**

  This component will encapsulate the current UI. For now, it will be a simple placeholder. We will move the logic from `App.tsx` here later.

  ```typescript
  // In frontend/src/components/TabLayout.tsx
  import React from 'react';

  const TabLayout: React.FC = () => {
    return <div>Tab Layout (Coming Soon)</div>;
  };

  export default TabLayout;
  ```

- [ ] **Step 2: Create PersonaLayout component**

  This component will hold the new persona-based view.

  ```typescript
  // In frontend/src/components/PersonaLayout.tsx
  import React from 'react';

  const PersonaLayout: React.FC = () => {
    return <div>Persona Layout (Coming Soon)</div>;
  };

  export default PersonaLayout;
  ```

- [ ] **Step 3: Commit layout placeholders**

  ```bash
  git add frontend/src/components/TabLayout.tsx frontend/src/components/PersonaLayout.tsx
  git commit -m "feat(frontend): create placeholder layout components"
  ```

---

### Task 4: Implement Routing in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Refactor App.tsx for routing**

  `App.tsx` will now be responsible for routing to the correct layout. The existing state and logic will be moved to `TabLayout.tsx` in a later step.

  ```typescript
  // In frontend/src/App.tsx
  import { Routes, Route } from 'react-router-dom';
  import useViewMode from './utils/useViewMode';
  import TabLayout from './components/TabLayout';
  import PersonaLayout from './components/PersonaLayout';
  import './App.css';

  function App() {
    useViewMode(); // This hook now manages the routing based on localStorage

    return (
      <Routes>
        <Route path="/" element={<TabLayout />} />
        <Route path="/persona" element={<PersonaLayout />} />
      </Routes>
    );
  }

  export default App;
  ```

- [ ] **Step 2: Commit App.tsx routing changes**

  ```bash
  git add frontend/src/App.tsx
  git commit -m "refactor(frontend): implement top-level routing in App.tsx"
  ```

This initial set of tasks establishes the routing infrastructure. The next steps would involve moving the existing UI into `TabLayout`, building the `PersonaLayout`, and adding the toggle in the settings.
