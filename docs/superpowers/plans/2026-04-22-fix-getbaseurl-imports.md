# Fix getBaseUrl Imports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix TypeScript errors by updating `getBaseUrl` imports to use the correct location in `frontend/src/utils/api.ts`.

**Architecture:** Update relative imports in components to point to the new utility location.

**Tech Stack:** React, TypeScript, Vite.

---

### Task 1: Update FileBrowser.tsx

**Files:**
- Modify: `frontend/src/components/FileBrowser.tsx`

- [ ] **Step 1: Update import statement**

Change `import { getBaseUrl } from '../App';` to `import { getBaseUrl } from '../utils/api';`.

- [ ] **Step 2: Verify no other imports from '../App' remain if not needed**

### Task 2: Update UtilityPane.tsx

**Files:**
- Modify: `frontend/src/components/UtilityPane.tsx`

- [ ] **Step 1: Update import statement**

Change `import { getBaseUrl } from '../App'` to `import { getBaseUrl } from '../utils/api'`.

### Task 3: Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npm run build` in `frontend` directory.
Expected: Build succeeds without TS2614 errors.

- [ ] **Step 2: Commit changes**

Run: `git add frontend/src/components/FileBrowser.tsx frontend/src/components/UtilityPane.tsx`
Run: `git commit -m "fix: update getBaseUrl imports after refactor"`
