# Pixel Agents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement personality-driven "Pixel Agents" that provide conversational feedback via speech bubbles and custom avatars, while maintaining a clean terminal.

**Architecture:** Extend the session store to include persona definitions, inject behavior instructions via environment variables, and use a frontend parser to extract `<voice>` tags from the terminal stream for display in a dedicated UI component.

**Tech Stack:** FastAPI (Backend), React/Xterm.js (Frontend), JSON-based session storage.

---

### Task 1: Persona Registry & Storage

**Files:**
- Modify: `backend/store.py`
- Test: `tests/backend/test_store.py` (to be created)

- [x] **Step 1: Define Persona model and update Store**

```python
from pydantic import BaseModel
from typing import List, Optional

class Persona(BaseModel):
    id: str
    name: str
    instructions: str
    avatarId: str

# Update Store class in backend/store.py
class Store(BaseModel):
    sessions: List[SessionMetadata] = []
    personas: List[Persona] = [
        Persona(id="senior", name="The Senior", instructions="You are a grumpy senior engineer. Be brief, cynical, and obsessed with DRY and clean code.", avatarId="senior-1"),
        Persona(id="intern", name="The Intern", instructions="You are an over-eager intern. Use lots of emojis and be very enthusiastic about learning.", avatarId="intern-1"),
        Persona(id="cyberpunk", name="The Cyber-Punk", instructions="You are a cynical netrunner. Use glitchy metaphors and treat coding like a battlefield.", avatarId="cyber-1")
    ]
```

- [x] **Step 2: Add test for Persona persistence**

Create `tests/backend/test_store.py`:
```python
from backend.store import Store, Persona

def test_persona_defaults():
    store = Store()
    assert len(store.personas) == 3
    assert store.personas[0].id == "senior"

def test_add_persona():
    store = Store()
    new_persona = Persona(id="custom", name="Custom", instructions="Be helpful.", avatarId="custom-1")
    store.personas.append(new_persona)
    assert len(store.personas) == 4
```

- [x] **Step 3: Run tests**

Run: `pytest tests/backend/test_store.py -v`
Expected: PASS

- [x] **Step 4: Commit**

```bash
git add backend/store.py tests/backend/test_store.py
git commit -m "feat: add Persona model and default personas to store"
```

---

### Task 2: Persona API Endpoints

**Files:**
- Modify: `backend/main.py`
- Test: `tests/backend/test_api_personas.py` (to be created)

- [x] **Step 1: Add GET and POST /api/personas**

```python
@app.get("/api/personas")
async def get_personas():
    return store.personas

@app.post("/api/personas")
async def create_persona(persona: Persona):
    store.personas.append(persona)
    save_store(store)
    return persona
```

- [x] **Step 2: Add test for Persona API**

Create `tests/backend/test_api_personas.py`:
```python
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_personas():
    response = client.get("/api/personas")
    assert response.status_code == 200
    assert len(response.json()) >= 3
```

- [x] **Step 3: Commit**

```bash
git add backend/main.py tests/backend/test_api_personas.py
git commit -m "feat: add persona API endpoints"
```

---

### Task 3: Session Persona Integration

**Files:**
- Modify: `backend/session_manager.py`
- Modify: `backend/main.py`

- [x] **Step 1: Update Session metadata and launch logic**

In `backend/session_manager.py`, update `SessionMetadata` and `SessionManager.create_session`:
```python
# In backend/session_manager.py
class SessionMetadata(BaseModel):
    id: str
    name: str
    cwd: str
    personaId: Optional[str] = None

# In SessionManager.create_session
async def create_session(self, name: str, cwd: str, persona: Optional[Persona] = None):
    env = os.environ.copy()
    if persona:
        instructions = (
            f"You are {persona.name}. {persona.instructions} "
            "You MUST wrap all non-technical conversational chatter in <voice> tags. "
            "Do not wrap code, commands, or technical output in these tags."
        )
        env["GEMINI_SYSTEM_PROMPT_OVERRIDE"] = instructions # Adjust variable name for Gemini CLI
    
    # ... launch PTY with env
```

- [x] **Step 2: Update POST /api/sessions to accept personaId**

```python
@app.post("/api/sessions")
async def create_session(data: dict):
    persona = next((p for p in store.personas if p.id == data.get("personaId")), None)
    session_id = await manager.create_session(data["name"], data["cwd"], persona)
    # ...
```

- [x] **Step 3: Commit**

```bash
git add backend/session_manager.py backend/main.py
git commit -m "feat: inject persona instructions into session environment"
```

---

### Task 4: Frontend Persona Selection

**Files:**
- Modify: `frontend/src/components/NewSessionOverlay.tsx`
- Modify: `frontend/src/utils/api.ts`

- [x] **Step 1: Fetch personas in NewSessionOverlay**

```typescript
const [personas, setPersonas] = useState<Persona[]>([]);
const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

useEffect(() => {
    api.getPersonas().then(setPersonas);
}, []);
```

- [x] **Step 2: Add Persona UI selector**

Add a grid of avatars to the "New Session" overlay.

- [x] **Step 3: Commit**

```bash
git add frontend/src/components/NewSessionOverlay.tsx frontend/src/utils/api.ts
git commit -m "feat: allow selecting a persona when creating a new session"
```

---

### Task 5: Terminal Voice Extraction

**Files:**
- Modify: `frontend/src/components/Terminal.tsx`

- [x] **Step 1: Implement <voice> tag parser**

In `Terminal.tsx`, wrap the incoming data handler:
```typescript
let voiceBuffer = "";
let isInsideVoice = false;

const onData = (data: string) => {
    // Basic state machine to strip <voice>...</voice>
    // and call setVoiceMessage(content)
};
```

- [x] **Step 2: Create PixelAgent component**

Create `frontend/src/components/PixelAgent.tsx` with a speech bubble and avatar.

- [x] **Step 3: Commit**

```bash
git add frontend/src/components/Terminal.tsx frontend/src/components/PixelAgent.tsx
git commit -m "feat: implement voice tag parsing and PixelAgent UI"
```

---

### Task 6: Persona Creation Lab

**Files:**
- Create: `frontend/src/components/PersonaLab.tsx`

- [x] **Step 1: Build form for custom personas**
- [x] **Step 2: Integrate with Sidebar or Settings**
- [x] **Step 3: Commit**

```bash
git add frontend/src/components/PersonaLab.tsx
git commit -m "feat: add Persona Creation Lab"
```
