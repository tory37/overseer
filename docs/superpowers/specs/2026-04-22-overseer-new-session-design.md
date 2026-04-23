# Overseer New Agent Session Design Specification

**Date:** 2026-04-22
**Status:** Approved
**Topic:** Implementation of the "Blueprint" (Approach 1) New Agent Session Flow.

## 1. Overview
Overseer will feature a prominent "New Session" initiation flow designed as a full-screen "Blueprint" overlay. This view replaces the main workspace content to provide a focused, two-column interface for selecting repository context and AI CLI configuration.

## 2. UI/UX: The "Blueprint" Overlay
The overlay will be activated via a "New Session" button at the top of the Sidebar.

### 2.1. Layout Structure
- **Global Header:** Persistent title "New Agent Session" with a close button (Esc).
- **Two-Column Grid:**
    - **Left Column (Context):**
        - Searchable list of all repositories from the user's config.
        - "Browse Local System" action to select an un-tracked directory using the `FileBrowser` component.
        - Selection state: Highlighting the active repository or directory.
    - **Right Column (Agent):**
        - **CLI Presets:** Interactive cards for:
            - Gemini CLI (`gemini --approval-mode yolo`)
            - Cursor (`cursor .`)
            - Claude Code (`claude-code`)
            - Custom Command (Input field).
        - **Environment Variables:** Optional key-value editor for the session.
- **Persistent Footer (Action Bar):**
    - Summary text: "Launching [CLI] in [Path]".
    - Large "Launch Session" primary action.

## 3. Frontend Implementation Details
- **State Management:**
    - `isCreatingSession` boolean in `App.tsx` to toggle the overlay.
    - `selectedContext` (Repo or Path) and `selectedCLI` state within the overlay.
- **Component:** `NewSessionOverlay.tsx` will be created in `frontend/src/components/`.
- **Navigation:** Closing the overlay returns the user to their previous view (Active Tab or Repo Home).

## 4. Backend & Integration
- **Command Execution:** The `openTab` function in `App.tsx` will be updated to accept a dynamic `command` string instead of hardcoding the Gemini CLI.
- **PTY Initialization:** The backend `pty_manager.py` already supports dynamic commands.
- **Worktree Integration:** For Git-tracked repositories, the session will still optionally trigger the `git worktree` creation if a task identifier is provided.

## 5. Success Criteria
1. User can initiate a session from any part of the app.
2. User can select between existing repos or any local directory.
3. User can choose between multiple CLI presets or enter a custom command.
4. Launching the session correctly opens a new tab with the terminal running the chosen CLI in the chosen directory.
