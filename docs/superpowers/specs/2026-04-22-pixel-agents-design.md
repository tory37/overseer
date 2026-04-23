# Overseer Pixel Agents Design Specification

**Date:** 2026-04-22
**Status:** Approved
**Topic:** Implementation of personality-driven AI agents with visual representation.

## 1. Overview
Pixel Agents add a layer of personality to Overseer sessions. Users can choose from predefined personas or create custom ones. These personas affect the "voice" and visual appearance of the agent without compromising their technical coding capabilities.

## 2. Architecture

### 2.1. Persona Registry
Personas are stored in the local configuration file (`~/.overseer.json`).
Each persona object includes:
- `id`: Unique identifier.
- `name`: Display name of the agent.
- `instructions`: System prompt fragment defining behavior and tone.
- `avatarId`: Reference to a built-in pixel art sprite.

### 2.2. Predefined Personas
Overseer ships with a set of default templates:
- **The Senior**: Grumpy, brief, insists on clean code and DRY principles.
- **The Intern**: Over-eager, uses emojis, enthusiastic about learning.
- **The Cyber-Punk**: Cynical, uses glitchy metaphors, views coding as "netrunning."

## 3. Implementation: "The Persona Wrapper"

### 3.1. Prompt Injection
When a session is launched with a persona:
1. Overseer injects a specific system instruction into the agent's environment.
2. **Instruction:** "You are [Name]. [Instructions]. You MUST wrap all non-technical conversational chatter in `<voice>` tags. Do not wrap code, commands, or technical output in these tags."

### 3.2. Tag Interception (Frontend)
- The `Terminal.tsx` component parses the incoming WebSocket stream.
- Text inside `<voice>...</voice>` is extracted and diverted to a UI state (`activeVoiceLine`).
- Text outside the tags is rendered in the xterm.js terminal as standard output.

### 3.3. UI Representation
- **Speech Bubble**: A sleek, animated speech bubble appears near the terminal when a voice line is active.
- **Pixel Avatar**: A small, animated pixel art character is displayed next to the speech bubble, visually representing the persona.
- **Silence Toggle**: Users can click the avatar to "mute" voice output if they need to focus purely on the terminal.

## 4. Persona Creation Lab
A new UI view allows users to:
1. Input a name and custom behavioral instructions.
2. Select a pixel art sprite from a provided library.
3. Save the custom persona for future use.

## 5. Integration with "New Session" Flow
The "Blueprint" overlay (New Session view) will include a "Select Persona" section, allowing the user to pick an agent before launching the session.

## 6. Success Criteria
1. Personas can be selected during session creation.
2. The agent correctly uses `<voice>` tags based on the injected instructions.
3. The UI extracts these tags and displays them in a speech bubble without cluttering the terminal.
4. Users can create, save, and use custom personas.
