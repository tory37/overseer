# Agent Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Agent Library" pillar of the Overseer system, allowing users to manage role-based autonomous workflow instructions (Agents) alongside technical expertise (Skills) and voice (Personas).

**Architecture:** 
- Backend: Mirror the Skill Library's file-based storage and REST API for Agents.
- Frontend: Refactor `SkillLibrary.tsx` into a generic `ResourceLibrary.tsx` to handle both Skills and Agents.
- Integration: Update `SessionManager` to synthesize Persona, Agent, and Skills into a single system prompt.

**Tech Stack:** FastAPI, React (TypeScript), TailwindCSS.

---

### Task 1: Backend Store Updates

**Files:**
- Modify: `backend/store.py`

- [ ] **Step 1: Add `agents_directory` to `Config` and update `SessionTab`**

```python
class SessionTab(BaseModel):
    id: str
    name: str
    type: str = "agent"
    cwd: Optional[str] = None
    command: Optional[str] = None
    personaId: Optional[str] = None
    selectedAgentId: Optional[str] = None # New field
    selected_skills: List[str] = []
    active: bool = False

class Config(BaseModel):
    # ... existing fields
    skills_directory: Optional[str] = None
    agents_directory: Optional[str] = None # New field
    # ... existing fields
```

- [ ] **Step 2: Add `set_agents_directory` method to `Store`**

```python
    def set_agents_directory(self, path: str):
        self.config.agents_directory = path
        self.save()
```

### Task 2: Backend API Endpoints

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Add Agent-related request models**

```python
class AgentsDirectoryRequest(BaseModel):
    path: str

class AgentUpdate(BaseModel):
    name: str
    content: str
    description: Optional[str] = None
    category: Optional[str] = None
```

- [ ] **Step 2: Add `/api/agents` endpoints (mirrors skills)**

```python
@app.post("/api/config/agents-directory")
async def set_agents_directory(request: AgentsDirectoryRequest):
    store.set_agents_directory(request.path)
    return {"status": "ok"}

@app.get("/api/agents")
async def list_agents():
    # Mirror list_skills logic for agents_directory
    # ...
```

- [ ] **Step 3: Update `NewSessionRequest`**

```python
class NewSessionRequest(BaseModel):
    name: str
    cwd: str
    personaId: Optional[str] = None
    selectedAgentId: Optional[str] = None # New field
    selectedSkills: Optional[List[str]] = []
    command: Optional[str] = None
    rows: Optional[int] = 24
    cols: Optional[int] = 80
```

### Task 3: Session Manager Integration (Discovery Approach)

**Files:**
- Modify: `backend/session_manager.py`

- [ ] **Step 1: Update `create_session` to inject directory paths**
  - Pass `OVERSEER_SKILLS_DIR` and `OVERSEER_AGENTS_DIR` in `extra_env`.
  - Update system prompt to explain these resources.

```python
        # In SessionManager.create_session
        skills_dir = store.config.skills_directory
        agents_dir = store.config.agents_directory
        
        if skills_dir:
            extra_env["OVERSEER_SKILLS_DIR"] = os.path.abspath(os.path.expanduser(skills_dir))
        if agents_dir:
            extra_env["OVERSEER_AGENTS_DIR"] = os.path.abspath(os.path.expanduser(agents_dir))

        instructions += "\n# RESOURCE LIBRARIES\n"
        instructions += "You have access to specialized libraries of instructions:\n"
        if skills_dir:
            instructions += f"- Technical Skills: Located at {extra_env['OVERSEER_SKILLS_DIR']}. Browse this for implementation standards and expertise.\n"
        if agents_dir:
            instructions += f"- Agent Roles: Located at {extra_env['OVERSEER_AGENTS_DIR']}. Browse this for workflow and autonomous role definitions.\n"
        instructions += "\nYou should use your file system tools to explore these directories if you need specific guidance or to adopt a specialized workflow.\n"
```

### Task 4: Frontend UI Simplification

- [ ] **Step 1: Simplify `NewSessionOverlay.tsx`**
  - Remove Skill/Agent selection.
  - Focus on Context (Repo), Persona, and Command.
- [ ] **Step 2: Update `ResourceLibrary.tsx` (Complete)**
  - Keep the management UI as it's the "Editor" for these resources.


### Task 5: Deep Researcher Agent

**Files:**
- Create: `DeepResearcher.md` (place in agents directory)

- [ ] **Step 1: Write the "Deep Researcher" agent instructions**
  - Use autonomous loop patterns (Discovery, Reasoning, Synthesis).
  - Explicit instructions for search and codebase analysis.

### Task 6: Verification

- [ ] **Step 1: Verify backend endpoints**
- [ ] **Step 2: Verify frontend UI for Agent Library**
- [ ] **Step 3: Create a session with Persona + Agent + Skills and verify the synthesized prompt in `/tmp`**
