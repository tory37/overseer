# Overseer New Agent Session Design Specification

**Date:** 2026-04-22
**Status:** Draft (Pending User Review)
**Topic:** Design for initiating new agent sessions and enhanced terminal capabilities within Overseer.

## 1. Updated Overview

Overseer will provide a unified command center for managing multiple Gemini CLI agent instances and repositories. A core interaction will be the "New Message" flow, allowing users to quickly create isolated agent sessions, selecting both a repository context and the specific AI CLI to interact with. These sessions will leverage enhanced terminal capabilities to closely mimic a user's native terminal environment, all within an integrated, desktop-style web application.

## 2. New Agent Session Flow

*   **Initiation:** A prominent UI element (e.g., a "New Message" button or icon) will be available, likely in the sidebar or a persistent header, to initiate a new agent session.
*   **Overlay/Dedicated View:** Upon activation, a full-screen overlay or dedicated view will appear, temporarily replacing the content of the main agent window. This view will act as the "input page" for configuring the new session.
*   **Repository/Directory Selection:**
    *   **Existing Repositories:** The overlay will present a navigable list or tree view of existing repositories and their organized hierarchy, allowing users to select a pre-configured project context.
    *   **New Directory:** An option to browse the local file system will be available, enabling users to select any directory on their machine to serve as the session's working directory.
*   **AI CLI Selection:**
    *   **Predefined List:** A dropdown or list will display commonly used AI CLIs (e.g., Gemini CLI, Cursor Agent, Claude CLI) with their default invocation commands. Users can select one of these with a single click.
    *   **Custom Configuration:** An input field and associated settings will allow users to manually enter a custom CLI command, arguments, and potentially environment variables for advanced or non-standard AI agents. This configuration can optionally be saved for future reuse.
*   **Session Launch:** Once the repository/directory and AI CLI are selected/configured, a "Start Session" or similar button will close the overlay and launch the new agent session in a dedicated tab within the main workspace. The selected AI CLI will be initiated within the session's terminal.

## 3. Enhanced Terminal Capabilities

The integrated terminal within each agent session will be powered by `xterm.js` in the frontend, connected to a `pypty`-managed process in the backend, and will feature the following enhancements to maximize compatibility with user configurations:

*   **Default Shell Detection:** Upon starting a new session, the backend will attempt to detect the user's default shell (e.g., `zsh`, `bash`) by querying the operating system's environment.
*   **Dotfile Sourcing:** The shell process launched within the PTY will be configured to explicitly source relevant user configuration files (e.g., `~/.zshrc`, `~/.bashrc`, `~/.profile`). This aims to bring in user-defined aliases, functions, environment variables, and prompt customizations.
*   **Environment Variable Inheritance:** The PTY-launched shell will inherit relevant environment variables from the Overseer backend process, which itself runs in the user's system environment, ensuring access to system-wide configurations and installed tools (like `ssh`, `git`, `docker`, etc.).
*   **Responsive Emulation:** `xterm.js` will provide a responsive and feature-rich emulation of a standard terminal, supporting 256 colors, true color, and standard VT100/Xterm escape sequences, crucial for interactive CLI applications and text-based UIs.
*   **Limitations & Future Considerations:** While significant effort will be made to replicate the user's native terminal experience, some highly specialized visual customizations (e.g., specific fonts requiring font patching, certain graphical powerline themes) may not perfectly translate. Users will be advised that while functionality is prioritized, aesthetic replication might vary.
