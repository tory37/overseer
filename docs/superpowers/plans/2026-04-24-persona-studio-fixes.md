# Persona Studio Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four bugs in Persona Studio: focus loss on typing, missing clothing color picker, name/title data model split, and broken delete/update API routes.

**Architecture:** Backend model changes first (store → API → session_manager), then frontend types, then frontend components. Each task is independently committable. Existing tests are updated before or alongside the code changes that break them.

**Tech Stack:** FastAPI + Pydantic (backend), React + TypeScript + Vitest (frontend), DiceBear pixelArt avatars (`@dicebear/collection`).

---

## File Map

| File | Change |
|---|---|
| `backend/store.py` | Add `clothingColor` to `AvatarConfig`; add `name`+`title` to `Persona`; update predefined personas; add `delete_persona()`/`update_persona()`; migration |
| `backend/main.py` | Add `DELETE /api/personas/{id}` and `PUT /api/personas/{id}` |
| `backend/session_manager.py` | Update prompt injection to use both `name` and `title` |
| `frontend/src/utils/api.ts` | Add `clothingColor` to `AvatarConfig`; add `title` to `Persona`; update `DEFAULT_AVATAR_CONFIG` |
| `frontend/src/components/AgentAvatar.tsx` | Pass `clothingColor` to `createAvatar()` |
| `frontend/src/components/PersonaStudio.tsx` | Inline Sidebar/Editor JSX; add title+name fields; add clothingColor picker |
| `tests/backend/test_store.py` | Update for new model fields; add delete/update tests |
| `tests/backend/test_api_personas.py` | Update for new fields; add DELETE/PUT route tests |
| `frontend/src/components/AgentAvatar.test.tsx` | Add `clothingColor` to test fixture |

---

### Task 1: Backend store — model changes, predefined personas, migration

Add `clothingColor` to `AvatarConfig`, split `name` into `name` (personal) + `title` (role label), update predefined personas, add migration for old saved data.

**Files:**
- Modify: `backend/store.py`
- Modify: `tests/backend/test_store.py`

- [ ] **Step 1: Update `test_store.py` to expect new model fields**

Replace the contents of `tests/backend/test_store.py` with:

```python
import os
import json
import pytest
from pathlib import Path
from backend.store import Store, Persona, Repo, Config
import backend.store

@pytest.fixture
def temp_store(tmp_path):
    original_path = backend.store.CONFIG_PATH
    temp_config = tmp_path / ".overseer.json"
    backend.store.CONFIG_PATH = temp_config
    yield Store()
    backend.store.CONFIG_PATH = original_path

def test_persona_defaults(temp_store):
    store = temp_store
    assert hasattr(store.config, "personas")
    assert len(store.config.personas) == 3

    senior = next((p for p in store.config.personas if p.id == "senior"), None)
    assert senior is not None
    assert senior.title == "The Senior"
    assert senior.name == "Walt"
    assert "grumpy senior engineer" in senior.instructions
    assert hasattr(senior, "avatarConfig")

def test_add_persona(temp_store):
    store = temp_store
    new_persona = Persona(id="custom", name="Alex", title="The Helper", instructions="Be helpful.")
    store.config.personas.append(new_persona)
    assert len(store.config.personas) == 4

    store.save()
    new_store = Store()
    assert len(new_store.config.personas) == 4
    custom = next((p for p in new_store.config.personas if p.id == "custom"), None)
    assert custom is not None
    assert custom.name == "Alex"
    assert custom.title == "The Helper"

def test_persona_model_structure():
    persona_data = {
        "id": "test",
        "name": "Sam",
        "title": "Test Persona",
        "instructions": "These are test instructions.",
    }
    persona = Persona(**persona_data)
    assert persona.id == "test"
    assert persona.name == "Sam"
    assert persona.title == "Test Persona"
    assert persona.instructions == "These are test instructions."
    assert hasattr(persona, "avatarConfig")

def test_get_persona(temp_store):
    store = temp_store
    new_persona = Persona(id="getter", name="Jo", title="Getter Persona", instructions="Get me.")
    store.add_persona(new_persona)
    retrieved = store.get_persona("getter")
    assert retrieved is not None
    assert retrieved.id == "getter"
    assert retrieved.name == "Jo"
    assert retrieved.title == "Getter Persona"

    assert store.get_persona("non-existent") is None

def test_avatar_config_defaults():
    from backend.store import AvatarConfig
    config = AvatarConfig()
    assert config.eyes == "variant01"
    assert config.mouth == "variant04"
    assert config.hair == "short01"
    assert config.skinColor == "fcd5b0"
    assert config.hairColor == "6b3a2a"
    assert config.backgroundColor == "1e293b"
    assert config.clothingColor == "5bc0de"

def test_persona_has_avatar_config():
    from backend.store import Persona, AvatarConfig
    p = Persona(id="x", name="X", title="Role X", instructions="Be X.")
    assert isinstance(p.avatarConfig, AvatarConfig)
    assert p.avatarConfig.eyes == "variant01"
    assert p.avatarConfig.clothingColor == "5bc0de"

def test_delete_persona(temp_store):
    store = temp_store
    new_persona = Persona(id="to-delete", name="Del", title="Deletable", instructions="Gone soon.")
    store.add_persona(new_persona)
    assert store.get_persona("to-delete") is not None
    store.delete_persona("to-delete")
    assert store.get_persona("to-delete") is None

def test_update_persona(temp_store):
    store = temp_store
    updated = Persona(id="senior", name="Walter", title="The Senior", instructions="Updated instructions.")
    store.update_persona("senior", updated)
    retrieved = store.get_persona("senior")
    assert retrieved.name == "Walter"
    assert retrieved.instructions == "Updated instructions."

def test_update_persona_not_found(temp_store):
    store = temp_store
    with pytest.raises(ValueError, match="'ghost' not found"):
        store.update_persona("ghost", Persona(id="ghost", name="Ghost", title="Ghost", instructions="Boo."))

def test_migration_old_name_to_title(tmp_path):
    old_data = {
        "personas": [
            {
                "id": "legacy",
                "name": "The Legacy Bot",
                "instructions": "Old instructions.",
                "avatarConfig": {
                    "eyes": "variant01",
                    "mouth": "variant04",
                    "hair": "short01",
                    "skinColor": "fcd5b0",
                    "hairColor": "6b3a2a",
                    "backgroundColor": "1e293b"
                }
            }
        ]
    }
    config_file = tmp_path / ".overseer.json"
    config_file.write_text(json.dumps(old_data))

    original_path = backend.store.CONFIG_PATH
    backend.store.CONFIG_PATH = config_file
    try:
        store = Store()
        legacy = next((p for p in store.config.personas if p.id == "legacy"), None)
        assert legacy is not None
        assert legacy.title == "The Legacy Bot"
        assert legacy.name == ""
    finally:
        backend.store.CONFIG_PATH = original_path
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/agent-manager && python -m pytest tests/backend/test_store.py -v
```

Expected: Multiple failures — `AttributeError: 'Persona' object has no attribute 'title'`, `assert senior.title == "The Senior"`, etc.

- [ ] **Step 3: Update `backend/store.py` with new models, predefined personas, migration, and store methods**

Replace the entire file content:

```python
import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

CONFIG_PATH = Path.home() / ".overseer.json"

BUILTIN_AVATAR_CONFIGS = {
    "senior": {"eyes": "variant09", "mouth": "variant14", "hair": "short01", "skinColor": "f5cba7", "hairColor": "6b6b6b", "backgroundColor": "1e293b", "clothingColor": "4a5568"},
    "intern": {"eyes": "variant01", "mouth": "variant04", "hair": "short02", "skinColor": "fcd5b0", "hairColor": "8b4513", "backgroundColor": "0f172a", "clothingColor": "5bc0de"},
    "cyberpunk": {"eyes": "variant06", "mouth": "variant09", "hair": "mohawk01", "skinColor": "d4a574", "hairColor": "00ff88", "backgroundColor": "0a0a0f", "clothingColor": "00ff88"},
}

class Repo(BaseModel):
    id: str
    name: str
    path: str
    group_id: Optional[str] = None

class AvatarConfig(BaseModel):
    eyes: str = "variant01"
    mouth: str = "variant04"
    hair: str = "short01"
    skinColor: str = "fcd5b0"
    hairColor: str = "6b3a2a"
    backgroundColor: str = "1e293b"
    clothingColor: str = "5bc0de"

class Persona(BaseModel):
    id: str
    name: str = ""
    title: str = ""
    instructions: str
    avatarConfig: AvatarConfig = AvatarConfig()

class Group(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None

class SessionTab(BaseModel):
    id: str
    name: str
    type: str = "agent"
    cwd: Optional[str] = None
    command: Optional[str] = None
    personaId: Optional[str] = None
    active: bool = False

class Config(BaseModel):
    repos: List[Repo] = []
    groups: List[Group] = []
    sessions: List[SessionTab] = []
    personas: List[Persona] = [
        Persona(
            id="senior",
            name="Walt",
            title="The Senior",
            instructions="You are a grumpy senior engineer. Be brief, cynical, and obsessed with DRY and clean code.",
            avatarConfig=AvatarConfig(eyes="variant09", mouth="variant14", hair="short01", skinColor="f5cba7", hairColor="6b6b6b", backgroundColor="1e293b", clothingColor="4a5568"),
        ),
        Persona(
            id="intern",
            name="Tyler",
            title="The Intern",
            instructions="You are an over-eager intern. Use lots of emojis and be very enthusiastic about learning.",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="variant04", hair="short02", skinColor="fcd5b0", hairColor="8b4513", backgroundColor="0f172a", clothingColor="5bc0de"),
        ),
        Persona(
            id="cyberpunk",
            name="Nyx",
            title="The Cyber-Punk",
            instructions="You are a cynical netrunner. Use glitchy metaphors and treat coding like a battlefield.",
            avatarConfig=AvatarConfig(eyes="variant06", mouth="variant09", hair="mohawk01", skinColor="d4a574", hairColor="00ff88", backgroundColor="0a0a0f", clothingColor="00ff88"),
        ),
    ]

class Store:
    def __init__(self):
        self.config = self._load()

    def _load(self) -> Config:
        if not CONFIG_PATH.exists():
            return Config()
        try:
            with open(CONFIG_PATH, "r") as f:
                data = json.load(f)
            if "personas" in data:
                for persona in data["personas"]:
                    # Migrate old avatarId format
                    if "avatarId" in persona:
                        if "avatarConfig" not in persona:
                            builtin = BUILTIN_AVATAR_CONFIGS.get(persona["id"])
                            persona["avatarConfig"] = builtin if builtin else {}
                        del persona["avatarId"]
                    # Migrate old name-only format: name → title, name → ""
                    if "title" not in persona and "name" in persona:
                        persona["title"] = persona["name"]
                        persona["name"] = ""
            return Config(**data)
        except Exception as e:
            print(f"Error loading config: {e}")
            return Config()

    def save(self):
        try:
            with open(CONFIG_PATH, "w") as f:
                json.dump(self.config.dict(), f, indent=2)
        except Exception as e:
            print(f"Error saving config: {e}")

    def add_repo(self, repo: Repo):
        self.config.repos.append(repo)
        self.save()

    def add_group(self, group: Group):
        self.config.groups.append(group)
        self.save()

    def add_persona(self, persona: Persona):
        if any(p.id == persona.id for p in self.config.personas):
            raise ValueError(f"Persona with ID '{persona.id}' already exists.")
        self.config.personas.append(persona)
        self.save()

    def delete_persona(self, persona_id: str):
        self.config.personas = [p for p in self.config.personas if p.id != persona_id]
        self.save()

    def update_persona(self, persona_id: str, updated: Persona):
        for i, p in enumerate(self.config.personas):
            if p.id == persona_id:
                self.config.personas[i] = updated
                self.save()
                return
        raise ValueError(f"Persona '{persona_id}' not found.")

    def update_sessions(self, sessions: List[SessionTab]):
        self.config.sessions = sessions
        self.save()

    def get_persona(self, persona_id: str) -> Optional[Persona]:
        for persona in self.config.personas:
            if persona.id == persona_id:
                return persona
        return None

    def get_all(self) -> Dict[str, Any]:
        return self.config.dict()
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/toryhebert/src/agent-manager && python -m pytest tests/backend/test_store.py -v
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/store.py tests/backend/test_store.py
git commit -m "feat: add clothingColor and name/title split to Persona model"
```

---

### Task 2: Backend API — DELETE + PUT routes

Add the missing `DELETE /api/personas/{id}` and `PUT /api/personas/{id}` endpoints to `main.py`.

**Files:**
- Modify: `backend/main.py`
- Modify: `tests/backend/test_api_personas.py`

- [ ] **Step 1: Update `test_api_personas.py` with new field expectations and DELETE/PUT tests**

Replace the entire file:

```python
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_personas():
    response = client.get("/api/personas")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    persona_ids = [p["id"] for p in data]
    assert "senior" in persona_ids
    assert "intern" in persona_ids
    assert "cyberpunk" in persona_ids
    senior = next(p for p in data if p["id"] == "senior")
    assert "avatarConfig" in senior
    assert senior["avatarConfig"]["eyes"] == "variant09"
    assert senior["title"] == "The Senior"
    assert senior["name"] == "Walt"
    assert senior["avatarConfig"]["clothingColor"] == "4a5568"

def test_create_persona():
    new_persona = {
        "id": "test-bot",
        "name": "Bot",
        "title": "Test Bot",
        "instructions": "Be a bot for testing.",
        "avatarConfig": {
            "eyes": "variant01",
            "mouth": "variant04",
            "hair": "short01",
            "skinColor": "fcd5b0",
            "hairColor": "6b3a2a",
            "backgroundColor": "1e293b",
            "clothingColor": "5bc0de"
        }
    }
    from backend.main import store
    store.config.personas = [p for p in store.config.personas if p.id != "test-bot"]
    response = client.post("/api/personas", json=new_persona)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "test-bot"
    assert data["title"] == "Test Bot"
    assert data["name"] == "Bot"
    assert data["avatarConfig"]["clothingColor"] == "5bc0de"

    response = client.get("/api/personas")
    assert "test-bot" in [p["id"] for p in response.json()]

def test_delete_persona():
    from backend.main import store
    store.config.personas = [p for p in store.config.personas if p.id != "to-del"]
    from backend.store import Persona
    store.add_persona(Persona(id="to-del", name="Del", title="Deletable", instructions="Delete me."))

    response = client.delete("/api/personas/to-del")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    response = client.get("/api/personas")
    assert "to-del" not in [p["id"] for p in response.json()]

def test_update_persona():
    from backend.main import store
    from backend.store import Persona
    store.config.personas = [p for p in store.config.personas if p.id != "to-update"]
    store.add_persona(Persona(id="to-update", name="Old", title="Old Title", instructions="Old instructions."))

    updated_data = {
        "id": "to-update",
        "name": "New",
        "title": "New Title",
        "instructions": "Updated instructions.",
        "avatarConfig": {
            "eyes": "variant01",
            "mouth": "variant04",
            "hair": "short01",
            "skinColor": "fcd5b0",
            "hairColor": "6b3a2a",
            "backgroundColor": "1e293b",
            "clothingColor": "5bc0de"
        }
    }
    response = client.put("/api/personas/to-update", json=updated_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New"
    assert data["title"] == "New Title"
    assert data["instructions"] == "Updated instructions."

import unittest.mock as mock
from backend.session_manager import SessionManager, Persona

@mock.patch.object(SessionManager, 'create_session')
def test_create_session_with_persona_id(mock_create_session):
    mock_create_session.return_value = "mock-session-id-with-persona"
    persona_id = "test-persona-session"
    test_persona = Persona(
        id=persona_id,
        name="Test",
        title="Test Session Persona",
        instructions="Instructions for session.",
    )
    from backend.main import store
    store.config.personas = [p for p in store.config.personas if p.id != persona_id]
    store.add_persona(test_persona)

    response = client.post("/api/sessions", json={
        "name": "Test Session with Persona",
        "cwd": "/tmp",
        "personaId": persona_id
    })
    assert response.status_code == 200
    assert response.json() == {"id": "mock-session-id-with-persona"}

    mock_create_session.assert_called_once()
    args, kwargs = mock_create_session.call_args
    assert isinstance(args[2], Persona)
    assert args[2].id == persona_id

@mock.patch.object(SessionManager, 'create_session')
def test_create_session_without_persona_id(mock_create_session):
    mock_create_session.return_value = "mock-session-id-without-persona"
    response = client.post("/api/sessions", json={
        "name": "Test Session without Persona",
        "cwd": "/tmp"
    })
    assert response.status_code == 200
    assert response.json() == {"id": "mock-session-id-without-persona"}
    args, kwargs = mock_create_session.call_args
    assert args[2] is None
```

- [ ] **Step 2: Run tests to confirm DELETE/PUT tests fail (routes missing)**

```bash
cd /home/toryhebert/src/agent-manager && python -m pytest tests/backend/test_api_personas.py -v
```

Expected: `test_delete_persona` and `test_update_persona` fail with 405 Method Not Allowed.

- [ ] **Step 3: Add DELETE and PUT routes to `backend/main.py`**

After the existing `@app.post("/api/personas")` block (around line 80), add:

```python
@app.delete("/api/personas/{persona_id}")
async def delete_persona(persona_id: str):
    store.delete_persona(persona_id)
    return {"status": "ok"}

@app.put("/api/personas/{persona_id}")
async def update_persona(persona_id: str, persona: Persona):
    store.update_persona(persona_id, persona)
    return persona
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
cd /home/toryhebert/src/agent-manager && python -m pytest tests/backend/test_api_personas.py -v
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/main.py tests/backend/test_api_personas.py
git commit -m "feat: add DELETE and PUT routes for personas API"
```

---

### Task 3: Session manager — update prompt injection for name + title

Update the persona instructions string to use both personal name and title.

**Files:**
- Modify: `backend/session_manager.py`

- [ ] **Step 1: Update the prompt injection string in `session_manager.py`**

Find this block (around line 110-121):

```python
        if persona:
            instructions = (
                f"You are {persona.name}. {persona.instructions} "
                "CRITICAL: ALL conversational speech, greetings, 'flair', personality interjections, or explanations MUST be wrapped in <voice> tags. "
```

Replace only the first line of `instructions`:

```python
        if persona:
            instructions = (
                f"Your name is {persona.name}. Your title is {persona.title}. {persona.instructions} "
                "CRITICAL: ALL conversational speech, greetings, 'flair', personality interjections, or explanations MUST be wrapped in <voice> tags. "
```

- [ ] **Step 2: Commit**

```bash
git add backend/session_manager.py
git commit -m "feat: inject persona name and title into AI prompt"
```

---

### Task 4: Frontend types — add clothingColor and title to interfaces

Update `api.ts` so the TypeScript types match the updated backend models.

**Files:**
- Modify: `frontend/src/utils/api.ts`

- [ ] **Step 1: Update `AvatarConfig`, `Persona`, and `DEFAULT_AVATAR_CONFIG` in `api.ts`**

Replace the `AvatarConfig` interface (lines 9-16):

```typescript
export interface AvatarConfig {
  eyes: string;
  mouth: string;
  hair: string;
  skinColor: string;
  hairColor: string;
  backgroundColor: string;
  clothingColor: string;
}
```

Replace `DEFAULT_AVATAR_CONFIG` (lines 18-25):

```typescript
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  eyes: 'variant01',
  mouth: 'variant04',
  hair: 'short01',
  skinColor: 'fcd5b0',
  hairColor: '6b3a2a',
  backgroundColor: '1e293b',
  clothingColor: '5bc0de',
};
```

Replace the `Persona` interface (lines 27-32):

```typescript
export interface Persona {
  id: string;
  name: string;
  title: string;
  instructions: string;
  avatarConfig: AvatarConfig;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/utils/api.ts
git commit -m "feat: add clothingColor and title to frontend Persona/AvatarConfig types"
```

---

### Task 5: AgentAvatar — pass clothingColor to createAvatar

Wire the new `clothingColor` field into the DiceBear avatar generator and update the test fixture.

**Files:**
- Modify: `frontend/src/components/AgentAvatar.tsx`
- Modify: `frontend/src/components/AgentAvatar.test.tsx`

- [ ] **Step 1: Update test fixture to include `clothingColor`**

In `AgentAvatar.test.tsx`, replace the `config` constant (lines 20-27):

```typescript
const config: AvatarConfig = {
  eyes: 'variant01',
  mouth: 'variant04',
  hair: 'short01',
  skinColor: 'fcd5b0',
  hairColor: '6b3a2a',
  backgroundColor: '1e293b',
  clothingColor: '5bc0de',
};
```

- [ ] **Step 2: Run tests to confirm they fail (type error on missing field)**

```bash
cd /home/toryhebert/src/agent-manager/frontend && npm run test
```

Expected: TypeScript compilation error or test failures due to missing `clothingColor` in `AvatarConfig`.

- [ ] **Step 3: Add `clothingColor` to `createAvatar()` call in `AgentAvatar.tsx`**

Replace the `createAvatar` call block (lines 35-43):

```typescript
    const avatar = createAvatar(pixelArt, {
      eyes: [avatarConfig.eyes],
      mouth: [mouthVariant],
      hair: [avatarConfig.hair],
      skinColor: [avatarConfig.skinColor],
      hairColor: [avatarConfig.hairColor],
      backgroundColor: [avatarConfig.backgroundColor],
      clothingColor: [avatarConfig.clothingColor],
      size,
    });
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/toryhebert/src/agent-manager/frontend && npm run test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AgentAvatar.tsx frontend/src/components/AgentAvatar.test.tsx
git commit -m "feat: pass clothingColor to DiceBear avatar generator"
```

---

### Task 6: PersonaStudio — fix focus loss by inlining Sidebar and Editor JSX

Remove the inner `Sidebar` and `Editor` function component definitions. React was treating them as new component types on every render (since they're new function references), causing full unmount/remount on every state change, which wiped focus and scrolled to top. Inlining the JSX into the return statement fixes this.

**Files:**
- Modify: `frontend/src/components/PersonaStudio.tsx`

- [ ] **Step 1: Replace the component — remove inner function definitions, inline JSX**

Replace the entire `frontend/src/components/PersonaStudio.tsx` with the following. The Sidebar and Editor JSX bodies are unchanged from the current file; only the structural wrapper functions are removed:

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { Persona } from '../utils/api';
import { getPersonas, createPersona, updatePersona, deletePersona } from '../utils/api';
import type { AvatarConfig } from '../utils/api';
import { DEFAULT_AVATAR_CONFIG } from '../utils/api';
import { AgentAvatar } from './AgentAvatar';
import { Plus, Search, Save, Trash2, X, Ghost } from 'lucide-react';

const PersonaStudio: React.FC = () => {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<Persona>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPersonas();
    }, []);

    const fetchPersonas = async () => {
        setIsLoading(true);
        try {
            const fetchedPersonas = await getPersonas();
            setPersonas(fetchedPersonas);
        } catch (err) {
            setError('Failed to fetch personas.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPersona = (persona: Persona) => {
        setSelectedPersona(persona);
        setFormData(persona);
        setIsCreatingNew(false);
    };

    const handleCreateNew = () => {
        setSelectedPersona(null);
        setFormData({ id: '', name: '', title: '', instructions: '', avatarConfig: { ...DEFAULT_AVATAR_CONFIG } });
        setIsCreatingNew(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarConfigChange = (field: keyof AvatarConfig, value: string) => {
        setFormData(prev => ({
            ...prev,
            avatarConfig: {
                ...(prev.avatarConfig ?? DEFAULT_AVATAR_CONFIG),
                [field]: value,
            },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.id || !formData.title || !formData.instructions) {
            setError('ID, Title, and Instructions are required.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isCreatingNew) {
                await createPersona(formData as Persona);
            } else if (selectedPersona) {
                await updatePersona(selectedPersona.id, formData as Persona);
            }
            await fetchPersonas();
            setIsCreatingNew(false);
            setSelectedPersona(null);
            setFormData({});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this persona?')) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await deletePersona(id);
            await fetchPersonas();
            if (selectedPersona?.id === id) {
                setSelectedPersona(null);
                setFormData({});
            }
        } catch (err) {
            setError('Failed to delete persona.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPersonas = useMemo(() =>
        personas.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase())
        ), [personas, searchTerm]
    );

    return (
        <div className="flex h-full w-full bg-slate-900 text-slate-300 font-sans">
            {/* Sidebar */}
            <div className="flex flex-col bg-slate-800/50 border-r border-slate-700/50 w-1/3">
                <div className="p-4 border-b border-slate-700/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search personas..."
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-md pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {filteredPersonas.map(persona => (
                        <div
                            key={persona.id}
                            className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50 ${selectedPersona?.id === persona.id && !isCreatingNew ? 'bg-blue-600/30' : ''}`}
                            onClick={() => handleSelectPersona(persona)}
                        >
                            <div>
                                <p className="font-semibold text-white">{persona.name} — {persona.title}</p>
                                <p className="text-xs text-slate-400">{persona.id}</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(persona.id);
                                }}
                                className="text-slate-500 hover:text-red-400"
                                aria-label="Delete Persona"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-700/50">
                    <button
                        onClick={handleCreateNew}
                        className={`w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 ${isCreatingNew ? 'ring-2 ring-blue-400' : ''}`}
                    >
                        <Plus className="w-5 h-5" />
                        Create New Persona
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="w-2/3 p-8 flex flex-col">
                {!selectedPersona && !isCreatingNew ? (
                    <div className="m-auto text-center text-slate-500">
                        <Ghost className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-xl font-bold">Persona Studio</h2>
                        <p>Select a persona to edit or create a new one.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {isCreatingNew ? 'Create New Persona' : `Editing: ${selectedPersona?.name} — ${selectedPersona?.title}`}
                            </h2>
                            <button type="button" onClick={() => { setSelectedPersona(null); setIsCreatingNew(false); }} className="text-slate-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4">{error}</div>}

                        <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="id" className="block text-sm font-semibold text-slate-300 mb-1">ID</label>
                                <input
                                    type="text"
                                    name="id"
                                    value={formData.id || ''}
                                    onChange={handleFormChange}
                                    disabled={!isCreatingNew}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    placeholder="unique-persona-id"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-slate-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title || ''}
                                    onChange={handleFormChange}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="The Senior"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleFormChange}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Walt"
                                />
                            </div>
                            <div>
                                <label htmlFor="instructions" className="block text-sm font-semibold text-slate-300 mb-1">System Prompt</label>
                                <textarea
                                    name="instructions"
                                    value={formData.instructions || ''}
                                    onChange={handleFormChange}
                                    rows={15}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="You are a helpful assistant..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Avatar</label>
                                <div className="flex gap-8">
                                    {/* Left: controls */}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Eyes</label>
                                            <select
                                                value={formData.avatarConfig?.eyes ?? 'variant01'}
                                                onChange={e => handleAvatarConfigChange('eyes', e.target.value)}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="variant01">Default</option>
                                                <option value="variant09">Narrow</option>
                                                <option value="variant06">Wide</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Mouth</label>
                                            <select
                                                value={formData.avatarConfig?.mouth ?? 'variant04'}
                                                onChange={e => handleAvatarConfigChange('mouth', e.target.value)}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="variant04">Smile</option>
                                                <option value="variant09">Open</option>
                                                <option value="variant14">Grin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Hair</label>
                                            <select
                                                value={formData.avatarConfig?.hair ?? 'short01'}
                                                onChange={e => handleAvatarConfigChange('hair', e.target.value)}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="short01">Short</option>
                                                <option value="short02">Short Alt</option>
                                                <option value="mohawk01">Mohawk</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-2">Skin Tone</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {['fcd5b0', 'f5cba7', 'd4a574', 'c68642', '8d5524', '4a2912'].map(hex => (
                                                    <button
                                                        key={hex}
                                                        type="button"
                                                        onClick={() => handleAvatarConfigChange('skinColor', hex)}
                                                        className={`w-7 h-7 rounded-md border-2 transition-all ${formData.avatarConfig?.skinColor === hex ? 'border-blue-400 scale-110' : 'border-transparent hover:border-slate-500'}`}
                                                        style={{ backgroundColor: `#${hex}` }}
                                                        title={`#${hex}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-2">Hair Color</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {['6b3a2a', '8b4513', '6b6b6b', 'f0c040', '00ff88', '1a1a1a', 'ff4444', '4444ff'].map(hex => (
                                                    <button
                                                        key={hex}
                                                        type="button"
                                                        onClick={() => handleAvatarConfigChange('hairColor', hex)}
                                                        className={`w-7 h-7 rounded-md border-2 transition-all ${formData.avatarConfig?.hairColor === hex ? 'border-blue-400 scale-110' : 'border-transparent hover:border-slate-500'}`}
                                                        style={{ backgroundColor: `#${hex}` }}
                                                        title={`#${hex}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-2">Clothing Color</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {['5bc0de', '428bca', '03396c', '88d8b0', '4a5568', 'e53e3e', 'ed8936', '9f7aea'].map(hex => (
                                                    <button
                                                        key={hex}
                                                        type="button"
                                                        onClick={() => handleAvatarConfigChange('clothingColor', hex)}
                                                        className={`w-7 h-7 rounded-md border-2 transition-all ${formData.avatarConfig?.clothingColor === hex ? 'border-blue-400 scale-110' : 'border-transparent hover:border-slate-500'}`}
                                                        style={{ backgroundColor: `#${hex}` }}
                                                        title={`#${hex}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-2">Background</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {['1e293b', '0f172a', '0a0a0f', '1a1a2e', '0d1117', '111827'].map(hex => (
                                                    <button
                                                        key={hex}
                                                        type="button"
                                                        onClick={() => handleAvatarConfigChange('backgroundColor', hex)}
                                                        className={`w-7 h-7 rounded-md border-2 transition-all ${formData.avatarConfig?.backgroundColor === hex ? 'border-blue-400 scale-110' : 'border-transparent hover:border-slate-500'}`}
                                                        style={{ backgroundColor: `#${hex}` }}
                                                        title={`#${hex}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Right: live preview */}
                                    <div className="flex flex-col items-center gap-2 pt-2">
                                        <AgentAvatar
                                            avatarConfig={formData.avatarConfig ?? DEFAULT_AVATAR_CONFIG}
                                            state="idle"
                                            size={128}
                                        />
                                        <span className="text-xs text-slate-500">Preview</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-auto flex justify-end gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                {isLoading ? 'Saving...' : (isCreatingNew ? 'Create Persona' : 'Save Changes')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PersonaStudio;
```

- [ ] **Step 2: Run frontend type check**

```bash
cd /home/toryhebert/src/agent-manager/frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run frontend tests**

```bash
cd /home/toryhebert/src/agent-manager/frontend && npm run test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/PersonaStudio.tsx
git commit -m "feat: inline PersonaStudio JSX, add title/name fields and clothingColor picker"
```

---

### Task 7: Run full test suite

Verify all backend and frontend tests pass together before calling this done.

- [ ] **Step 1: Run all backend tests**

```bash
cd /home/toryhebert/src/agent-manager && python -m pytest tests/backend/ -v
```

Expected: All tests pass with no failures.

- [ ] **Step 2: Run all frontend tests**

```bash
cd /home/toryhebert/src/agent-manager/frontend && npm run test
```

Expected: All tests pass with no failures.
