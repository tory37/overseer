# Persona Studio & Special Tabs Design Specification

**Date:** 2026-04-23
**Status:** Approved
**Topic:** Redesigning Persona Lab into a full-screen "Studio" and unifying sidebar actions into a singleton tab system.

## 1. Overview
The Persona Lab is being promoted from a utility pane widget to a top-level "Studio" accessible from the main sidebar. This move establishes a pattern for "Special Tabs" (Persona Studio, Configuration, Global Search) that behave as singletons within the workspace.

## 2. Architecture Changes

### 2.1 Generalized Tab Interface
The `Tab` interface in `App.tsx` will be generalized to support different types of content:

```typescript
type TabType = 'agent' | 'persona-lab' | 'config' | 'search';

interface Tab {
  id: string;
  type: TabType;
  name: string;
  active: boolean;
  cwd?: string;         // Agent-only
  command?: string;     // Agent-only
  personaId?: string | null; // Agent-only
}
```

### 2.2 Singleton Routing Logic
A new `openSpecialTab(type: TabType)` function will be added to `App.tsx`:
- It searches the `tabs` state for an existing tab with the matching `type`.
- If found, it calls `setActive(id)`.
- If not found, it creates a new tab with a deterministic ID (e.g., `special-persona-lab`) and name (e.g., `Persona Studio`).

### 2.3 Tab Rendering Dispatcher
The main area in `App.tsx` will switch between different view containers based on the `activeTab.type`:
- `agent`: Renders `TabContainer.tsx`.
- `persona-lab`: Renders the new `PersonaStudio.tsx`.
- `config`: Renders a "Configuration" placeholder.
- `search`: Renders a "Global Search" placeholder.

## 3. UI Design

### 3.1 Sidebar (Navigation)
- The "Configuration", "Global Search", and a new "Persona Lab" menu item will be grouped in the bottom footer.
- Clicking these items will trigger `openSpecialTab`.

### 3.2 Persona Studio Layout
Redesigning the Persona Lab into a two-column "Studio":
- **Sidebar (Left, 300px):** 
  - A scrollable list of "Persona Cards".
  - Cards show the Avatar, Name, and a snippet of instructions.
  - A primary "Create New" button at the top.
- **Editor (Right, Flexible):**
  - The form for creating/editing the selected persona.
  - Large text areas for instructions.
  - Live preview of the persona's appearance.

## 4. Implementation Steps
1.  **Refactor `App.tsx`:** Update `Tab` interface and implement `openSpecialTab`.
2.  **Update `Sidebar.tsx`:** Add callbacks for footer actions and add the Persona Lab icon.
3.  **Create `PersonaStudio.tsx`:** Implement the two-column layout using existing `PersonaLab` logic but expanded for the full screen.
4.  **Cleanup `UtilityPane.tsx`:** Remove the Persona Lab mode and icon.

## 5. Success Criteria
- Clicking "Persona Lab" in the sidebar opens a tab named "Persona Studio".
- Subsequent clicks on the sidebar icon focus the existing tab instead of opening a new one.
- The Persona Studio provides a rich, multi-column interface for managing personas.
- Configuration and Global Search open their own respective singleton tabs (even if content is currently a placeholder).
