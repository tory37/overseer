# DiceBear Pixel-Art Avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dead `avatarId: string` placeholder with a structured `AvatarConfig` object that drives deterministic DiceBear pixel-art avatars in the sidebar, PixelAgent header, and PersonaStudio trait picker.

**Architecture:** A single reusable `AgentAvatar` component (Framer Motion wrapper + DiceBear SVG) holds all animation state locally — no global context. Parent components (`PixelAgent`, `PersonaSidebar`) derive avatar state from their own props and pass it down. `AvatarConfig` is a structured object defined in both the Pydantic backend model and the TypeScript frontend type.

**Tech Stack:** `@dicebear/core`, `@dicebear/collection` (pixel-art SVG generation), `framer-motion` (idle/talking/thinking animations), Vitest + Testing Library (frontend tests), pytest (backend tests).

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `backend/store.py` | Add `AvatarConfig` model, replace `avatarId` on `Persona`, update built-in configs |
| Modify | `tests/backend/test_store.py` | Update assertions from `avatarId` to `avatarConfig` |
| Modify | `tests/backend/test_api_personas.py` | Update payloads and assertions for `avatarConfig` |
| Modify | `frontend/src/utils/api.ts` | Add `AvatarConfig` interface + `DEFAULT_AVATAR_CONFIG`, update `Persona` |
| Create | `frontend/src/components/AgentAvatar.tsx` | Pixel-art avatar with idle/talking/thinking animation |
| Create | `frontend/src/components/AgentAvatar.test.tsx` | Component tests |
| Modify | `frontend/src/components/PersonaSidebar.tsx` | Replace Ghost icon with `AgentAvatar` |
| Modify | `frontend/src/components/TabContainer.tsx` | Pass `avatarConfig` instead of `avatarId` to `PixelAgent` |
| Modify | `frontend/src/components/PixelAgent.tsx` | Replace `avatarId` prop + fallback with `AgentAvatar`, add talking timer |
| Modify | `frontend/src/components/PersonaStudio.tsx` | Replace `avatarId` text field with two-column trait picker + live preview |

---

## Task 1: Install npm dependencies

**Files:**
- Modify: `frontend/package.json` (via npm install)

- [ ] **Step 1: Install the three new packages**

```bash
cd frontend && npm install @dicebear/core @dicebear/collection framer-motion
```

Expected: packages appear in `node_modules/`, `package.json` dependencies section updated.

- [ ] **Step 2: Verify TypeScript can see the types**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: No new errors related to the new packages (pre-existing errors are fine).

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: install dicebear, framer-motion for avatar feature"
```

---

## Task 2: Backend — AvatarConfig model and updated Persona

**Files:**
- Modify: `backend/store.py`

- [ ] **Step 1: Write the failing test (new AvatarConfig shape)**

Add to `tests/backend/test_store.py`:

```python
def test_avatar_config_defaults():
    from backend.store import AvatarConfig
    config = AvatarConfig()
    assert config.eyes == "variant01"
    assert config.mouth == "variant04"
    assert config.hair == "short01"
    assert config.skinColor == "fcd5b0"
    assert config.hairColor == "6b3a2a"
    assert config.backgroundColor == "1e293b"

def test_persona_has_avatar_config():
    from backend.store import Persona, AvatarConfig
    p = Persona(id="x", name="X", instructions="Be X.")
    assert isinstance(p.avatarConfig, AvatarConfig)
    assert p.avatarConfig.eyes == "variant01"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/toryhebert/src/agent-manager && python -m pytest tests/backend/test_store.py::test_avatar_config_defaults tests/backend/test_store.py::test_persona_has_avatar_config -v
```

Expected: `ImportError` or `AttributeError` — `AvatarConfig` doesn't exist yet.

- [ ] **Step 3: Implement AvatarConfig and update Persona in store.py**

Replace the `Persona` class block in `backend/store.py`. The full updated section (after the `Repo` class):

```python
class AvatarConfig(BaseModel):
    eyes: str = "variant01"
    mouth: str = "variant04"
    hair: str = "short01"
    skinColor: str = "fcd5b0"
    hairColor: str = "6b3a2a"
    backgroundColor: str = "1e293b"

class Persona(BaseModel):
    id: str
    name: str
    instructions: str
    avatarConfig: AvatarConfig = AvatarConfig()
```

Remove the old `class Persona(BaseModel)` block that contained `avatarId: str`.

- [ ] **Step 4: Update built-in persona configs in Config**

Replace the `personas` default list in the `Config` class:

```python
class Config(BaseModel):
    repos: List[Repo] = []
    groups: List[Group] = []
    sessions: List[SessionTab] = []
    personas: List[Persona] = [
        Persona(
            id="senior",
            name="The Senior",
            instructions="You are a grumpy senior engineer. Be brief, cynical, and obsessed with DRY and clean code.",
            avatarConfig=AvatarConfig(eyes="variant09", mouth="variant14", hair="short01", skinColor="f5cba7", hairColor="6b6b6b", backgroundColor="1e293b"),
        ),
        Persona(
            id="intern",
            name="The Intern",
            instructions="You are an over-eager intern. Use lots of emojis and be very enthusiastic about learning.",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="variant04", hair="short02", skinColor="fcd5b0", hairColor="8b4513", backgroundColor="0f172a"),
        ),
        Persona(
            id="cyberpunk",
            name="The Cyber-Punk",
            instructions="You are a cynical netrunner. Use glitchy metaphors and treat coding like a battlefield.",
            avatarConfig=AvatarConfig(eyes="variant06", mouth="variant09", hair="mohawk01", skinColor="d4a574", hairColor="00ff88", backgroundColor="0a0a0f"),
        ),
    ]
```

- [ ] **Step 5: Run the new tests to verify they pass**

```bash
cd /home/toryhebert/src/agent-manager && python -m pytest tests/backend/test_store.py::test_avatar_config_defaults tests/backend/test_store.py::test_persona_has_avatar_config -v
```

Expected: Both PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/store.py tests/backend/test_store.py
git commit -m "feat: add AvatarConfig model and update Persona with pixel-art configs"
```

---

## Task 3: Update backend tests for removed avatarId

**Files:**
- Modify: `tests/backend/test_store.py`
- Modify: `tests/backend/test_api_personas.py`

- [ ] **Step 1: Run existing backend tests to see what's broken**

```bash
cd /home/toryhebert/src/agent-manager && python -m pytest tests/backend/test_store.py tests/backend/test_api_personas.py -v 2>&1 | tail -30
```

Expected: Several failures referencing `avatarId`.

- [ ] **Step 2: Fix test_store.py — replace avatarId references**

In `tests/backend/test_store.py`, replace the `test_persona_defaults` function:

```python
def test_persona_defaults(temp_store):
    from backend.store import AvatarConfig
    store = temp_store
    assert hasattr(store.config, "personas")
    assert len(store.config.personas) == 3

    senior = next((p for p in store.config.personas if p.id == "senior"), None)
    assert senior is not None
    assert senior.name == "The Senior"
    assert "grumpy senior engineer" in senior.instructions
    assert isinstance(senior.avatarConfig, AvatarConfig)
    assert senior.avatarConfig.eyes == "variant09"
    assert senior.avatarConfig.hairColor == "6b6b6b"
```

Replace `test_add_persona`:

```python
def test_add_persona(temp_store):
    from backend.store import AvatarConfig
    store = temp_store
    new_persona = Persona(id="custom", name="Custom", instructions="Be helpful.")
    store.config.personas.append(new_persona)
    assert len(store.config.personas) == 4

    store.save()

    new_store = Store()
    assert len(new_store.config.personas) == 4
    custom = next((p for p in new_store.config.personas if p.id == "custom"), None)
    assert custom is not None
    assert custom.name == "Custom"
    assert isinstance(custom.avatarConfig, AvatarConfig)
```

Replace `test_persona_model_structure`:

```python
def test_persona_model_structure():
    from backend.store import AvatarConfig
    persona = Persona(id="test", name="Test Persona", instructions="These are test instructions.")
    assert persona.id == "test"
    assert persona.name == "Test Persona"
    assert persona.instructions == "These are test instructions."
    assert isinstance(persona.avatarConfig, AvatarConfig)
    assert persona.avatarConfig.eyes == "variant01"
```

Replace `test_get_persona`:

```python
def test_get_persona(temp_store):
    store = temp_store

    new_persona = Persona(id="getter", name="Getter Persona", instructions="Get me.")
    store.add_persona(new_persona)

    retrieved_persona = store.get_persona("getter")
    assert retrieved_persona is not None
    assert retrieved_persona.id == "getter"
    assert retrieved_persona.name == "Getter Persona"

    non_existent_persona = store.get_persona("non-existent")
    assert non_existent_persona is None
```

- [ ] **Step 3: Fix test_api_personas.py — replace avatarId in payloads**

In `tests/backend/test_api_personas.py`, replace `test_create_persona`:

```python
def test_create_persona():
    new_persona = {
        "id": "test-bot",
        "name": "Test Bot",
        "instructions": "Be a bot for testing.",
        "avatarConfig": {
            "eyes": "variant01",
            "mouth": "variant04",
            "hair": "short01",
            "skinColor": "fcd5b0",
            "hairColor": "6b3a2a",
            "backgroundColor": "1e293b"
        }
    }
    response = client.post("/api/personas", json=new_persona)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "test-bot"
    assert data["avatarConfig"]["eyes"] == "variant01"

    response = client.get("/api/personas")
    assert response.status_code == 200
    persona_ids = [p["id"] for p in response.json()]
    assert "test-bot" in persona_ids
```

In `test_get_personas`, add an assertion that `avatarConfig` is a dict (not `avatarId`):

```python
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
```

Replace the `test_create_session_with_persona_id` test — update the `test_persona` instantiation (remove `avatarId`):

```python
    test_persona = Persona(
        id=persona_id,
        name="Test Session Persona",
        instructions="Instructions for session.",
    )
```

- [ ] **Step 4: Run full backend test suite**

```bash
cd /home/toryhebert/src/agent-manager && python -m pytest tests/backend/ -v 2>&1 | tail -30
```

Expected: All tests PASS (or only pre-existing failures unrelated to our changes).

- [ ] **Step 5: Commit**

```bash
git add tests/backend/test_store.py tests/backend/test_api_personas.py
git commit -m "test: update backend tests for AvatarConfig replacing avatarId"
```

---

## Task 4: Frontend — AvatarConfig type and DEFAULT_AVATAR_CONFIG

**Files:**
- Modify: `frontend/src/utils/api.ts`

- [ ] **Step 1: Update api.ts**

Replace the current `Persona` interface block in `frontend/src/utils/api.ts`:

```typescript
export interface AvatarConfig {
  eyes: string;
  mouth: string;
  hair: string;
  skinColor: string;
  hairColor: string;
  backgroundColor: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  eyes: 'variant01',
  mouth: 'variant04',
  hair: 'short01',
  skinColor: 'fcd5b0',
  hairColor: '6b3a2a',
  backgroundColor: '1e293b',
};

export interface Persona {
  id: string;
  name: string;
  instructions: string;
  avatarConfig: AvatarConfig;
}
```

Remove the old `export interface Persona` block that contained `avatarId: string`.

Also update the `createPersona` signature — it accepts `Persona` which now has `avatarConfig`. No other change needed since the function body doesn't reference specific fields.

- [ ] **Step 2: Check TypeScript for cascading errors**

```bash
cd frontend && npx tsc --noEmit 2>&1
```

Expected: Errors pointing at files that still use `avatarId` (TabContainer, PixelAgent, PersonaStudio, PersonaSidebar). This is expected — we fix those in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/utils/api.ts
git commit -m "feat: add AvatarConfig interface and DEFAULT_AVATAR_CONFIG to api.ts"
```

---

## Task 5: Create AgentAvatar component (TDD)

**Files:**
- Create: `frontend/src/components/AgentAvatar.tsx`
- Create: `frontend/src/components/AgentAvatar.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/components/AgentAvatar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgentAvatar } from './AgentAvatar';
import type { AvatarConfig } from '../utils/api';

vi.mock('@dicebear/core', () => ({
  createAvatar: () => ({ toString: () => '<svg xmlns="http://www.w3.org/2000/svg"></svg>' }),
}));
vi.mock('@dicebear/collection', () => ({
  pixelArt: {},
}));
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { animate?: unknown; transition?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const config: AvatarConfig = {
  eyes: 'variant01',
  mouth: 'variant04',
  hair: 'short01',
  skinColor: 'fcd5b0',
  hairColor: '6b3a2a',
  backgroundColor: '1e293b',
};

describe('AgentAvatar', () => {
  it('renders an img element', () => {
    render(<AgentAvatar avatarConfig={config} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('applies pixelated image rendering', () => {
    render(<AgentAvatar avatarConfig={config} />);
    const img = screen.getByRole('img');
    expect(img).toHaveStyle({ imageRendering: 'pixelated' });
  });

  it('renders at the specified size', () => {
    render(<AgentAvatar avatarConfig={config} size={32} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '32');
    expect(img).toHaveAttribute('height', '32');
  });

  it('uses 40 as default size', () => {
    render(<AgentAvatar avatarConfig={config} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '40');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- AgentAvatar 2>&1 | tail -20
```

Expected: Cannot find module `./AgentAvatar`.

- [ ] **Step 3: Create AgentAvatar.tsx**

Create `frontend/src/components/AgentAvatar.tsx`:

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import { pixelArt } from '@dicebear/collection';
import type { AvatarConfig } from '../utils/api';

interface AgentAvatarProps {
  avatarConfig: AvatarConfig;
  state?: 'idle' | 'talking' | 'thinking';
  talkingUntil?: number;
  size?: number;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  avatarConfig,
  state = 'idle',
  talkingUntil = 0,
  size = 40,
}) => {
  const [mouthVariant, setMouthVariant] = useState(avatarConfig.mouth);

  useEffect(() => {
    if (state !== 'talking') {
      setMouthVariant(avatarConfig.mouth);
      return;
    }
    setMouthVariant(avatarConfig.mouth);
    const interval = setInterval(() => {
      setMouthVariant(v => (v === avatarConfig.mouth ? 'variant01' : avatarConfig.mouth));
    }, 150);
    return () => clearInterval(interval);
  }, [talkingUntil, state, avatarConfig.mouth]);

  const svgDataUrl = useMemo(() => {
    const avatar = createAvatar(pixelArt, {
      eyes: [avatarConfig.eyes],
      mouth: [mouthVariant],
      hair: [avatarConfig.hair],
      skinColor: [avatarConfig.skinColor],
      hairColor: [avatarConfig.hairColor],
      backgroundColor: [avatarConfig.backgroundColor],
      size,
    });
    const svg = avatar.toString();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [avatarConfig, mouthVariant, size]);

  return (
    <motion.div
      animate={state === 'thinking' ? { opacity: [0.6, 1, 0.6] } : { y: [0, -2, 0] }}
      transition={{
        duration: state === 'thinking' ? 1.2 : 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }}
    >
      <img
        src={svgDataUrl}
        alt="Agent Avatar"
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated' }}
      />
    </motion.div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- AgentAvatar 2>&1 | tail -20
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AgentAvatar.tsx frontend/src/components/AgentAvatar.test.tsx
git commit -m "feat: create AgentAvatar component with idle/talking/thinking animations"
```

---

## Task 6: PersonaSidebar — replace Ghost icon with AgentAvatar

**Files:**
- Modify: `frontend/src/components/PersonaSidebar.tsx`

- [ ] **Step 1: Update PersonaGroup props and render**

In `frontend/src/components/PersonaSidebar.tsx`:

1. Add the import at the top:
```tsx
import { AgentAvatar } from './AgentAvatar';
import { DEFAULT_AVATAR_CONFIG } from '../utils/api';
import type { AvatarConfig } from '../utils/api';
```

2. Keep `Ghost` in the lucide-react import — it's still used in the footer button for "Persona Lab". No import change needed.

3. Replace the `PersonaGroup` component entirely:

```tsx
const PersonaGroup = ({
  name,
  avatarConfig,
  sessions,
  selectedSessionId,
  onSelectSession,
}: {
  name: string;
  avatarConfig: AvatarConfig;
  sessions: SessionData[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="text-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left font-bold text-slate-400 py-1.5 px-2 hover:text-white flex items-center gap-1 rounded-md hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-[10px]">{expanded ? '▼' : '▶'}</span>
        <AgentAvatar avatarConfig={avatarConfig} state="idle" size={32} />
        <span className="ml-1">{name}</span>
      </button>
      {expanded && (
        <div className="pl-5 mt-1 space-y-0.5 border-l border-slate-800 ml-4">
          {sessions.map(session => (
            <SessionItem
              key={session.id}
              title={session.name}
              isActive={session.id === selectedSessionId}
              onClick={() => onSelectSession(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

4. Update the `namedGroups` mapping in `PersonaSidebar` to pass `avatarConfig`:

```tsx
const namedGroups = personas
  .filter(p => grouped.has(p.id))
  .map(p => ({ name: p.name, avatarConfig: p.avatarConfig, sessions: grouped.get(p.id)! }));
```

5. Update the `namedGroups.map` render call:

```tsx
{namedGroups.map(group => (
  <PersonaGroup
    key={group.name}
    name={group.name}
    avatarConfig={group.avatarConfig}
    sessions={group.sessions}
    selectedSessionId={selectedSessionId}
    onSelectSession={onSelectSession}
  />
))}
```

6. Update the ungrouped `PersonaGroup` render to pass a default config:

```tsx
{ungrouped.length > 0 && (
  <PersonaGroup
    name="Default Persona"
    avatarConfig={DEFAULT_AVATAR_CONFIG}
    sessions={ungrouped}
    selectedSessionId={selectedSessionId}
    onSelectSession={onSelectSession}
  />
)}
```

7. Also remove `Ghost` from the footer button (it still uses the Ghost icon for "Persona Lab" nav — keep it there). Only remove Ghost from the `PersonaGroup` component imports. Since Ghost is still used in the footer (`<Ghost className="w-4 h-4" />`), keep Ghost in the lucide-react import.

- [ ] **Step 2: Check TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep PersonaSidebar
```

Expected: No errors in PersonaSidebar.tsx.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PersonaSidebar.tsx
git commit -m "feat: replace Ghost icon with AgentAvatar in PersonaSidebar"
```

---

## Task 7: TabContainer + PixelAgent — avatarConfig prop, talking timer

**Files:**
- Modify: `frontend/src/components/TabContainer.tsx`
- Modify: `frontend/src/components/PixelAgent.tsx`

- [ ] **Step 1: Update TabContainer**

In `frontend/src/components/TabContainer.tsx`:

1. Add import:
```tsx
import { DEFAULT_AVATAR_CONFIG } from '../utils/api';
import type { AvatarConfig } from '../utils/api';
```

2. Replace the `avatarId` derivation (currently `const avatarId = activePersona?.avatarId || 'overseer'`):

```tsx
const avatarConfig: AvatarConfig = activePersona?.avatarConfig ?? DEFAULT_AVATAR_CONFIG;
```

3. Replace the `PixelAgent` usage — change `avatarId={avatarId}` to `avatarConfig={avatarConfig}`:

```tsx
<PixelAgent
  messages={messages}
  isWorking={isWorking}
  avatarConfig={avatarConfig}
  personaName={personaName}
  onSendMessage={handleSendMessage}
/>
```

- [ ] **Step 2: Update PixelAgent**

In `frontend/src/components/PixelAgent.tsx`:

1. Add imports:
```tsx
import { AgentAvatar } from './AgentAvatar';
import type { AvatarConfig } from '../utils/api';
```

2. Replace the `PixelAgentProps` interface — remove `avatarId`, add `avatarConfig`:

```typescript
interface PixelAgentProps {
  messages: VoiceMessage[];
  isWorking: boolean;
  avatarConfig: AvatarConfig;
  personaName?: string;
  onSendMessage?: (text: string) => void;
}
```

3. Update the component signature:

```tsx
export const PixelAgent: React.FC<PixelAgentProps> = ({ messages, isWorking, avatarConfig, personaName, onSendMessage }) => {
```

4. Remove the `avatarError` state and its `useEffect` — they handled the dead `avatarId.svg` fallback.

5. Add `talkingUntil` state and talking timer `useEffect` after the existing `useState` declarations:

```tsx
const [talkingUntil, setTalkingUntil] = useState(0);

useEffect(() => {
  if (messages.length === 0) return;
  const lastMsg = messages[messages.length - 1];
  if (lastMsg.sender !== 'agent') return;
  const wordCount = lastMsg.text.split(/\s+/).filter(Boolean).length;
  setTalkingUntil(Date.now() + wordCount * 80);
}, [messages]);
```

6. Add avatar state derivation just before the `return`:

```tsx
const avatarState = isWorking ? 'thinking' : talkingUntil > Date.now() ? 'talking' : 'idle';
```

7. Replace the avatar block in the header (the `{avatarId && !avatarError ? ... : ...}` conditional) with:

```tsx
<AgentAvatar avatarConfig={avatarConfig} state={avatarState} talkingUntil={talkingUntil} size={40} />
```

The status dot (`absolute -bottom-0.5 -right-0.5 ...`) sits next to the avatar — keep it, but the wrapping `<div className="relative">` still works since `AgentAvatar` returns a `motion.div` with `display: inline-flex`.

- [ ] **Step 3: Check TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep -E "PixelAgent|TabContainer"
```

Expected: No errors in these two files.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/TabContainer.tsx frontend/src/components/PixelAgent.tsx
git commit -m "feat: wire AgentAvatar into PixelAgent with talking timer and thinking state"
```

---

## Task 8: PersonaStudio — replace avatarId field with trait picker

**Files:**
- Modify: `frontend/src/components/PersonaStudio.tsx`

- [ ] **Step 1: Update imports and formData initialization**

In `frontend/src/components/PersonaStudio.tsx`:

1. Add imports:
```tsx
import { AgentAvatar } from './AgentAvatar';
import { DEFAULT_AVATAR_CONFIG } from '../utils/api';
import type { AvatarConfig } from '../utils/api';
```

2. Remove `Ghost` and `Edit` from the lucide-react import if unused after this change. (Keep `Plus, Search, Save, Trash2, X`.)

3. Update the `handleCreateNew` function — replace `avatarId: ''` with `avatarConfig: { ...DEFAULT_AVATAR_CONFIG }`:

```tsx
const handleCreateNew = () => {
  setSelectedPersona(null);
  setFormData({ id: '', name: '', instructions: '', avatarConfig: { ...DEFAULT_AVATAR_CONFIG } });
  setIsCreatingNew(true);
};
```

4. Update `handleSelectPersona` — `formData` is set to `persona` which already has `avatarConfig` from the API. No change needed there.

- [ ] **Step 2: Add avatar config change handler**

After `handleFormChange`, add:

```tsx
const handleAvatarConfigChange = (field: keyof AvatarConfig, value: string) => {
  setFormData(prev => ({
    ...prev,
    avatarConfig: {
      ...(prev.avatarConfig ?? DEFAULT_AVATAR_CONFIG),
      [field]: value,
    },
  }));
};
```

- [ ] **Step 3: Replace the avatarId input with the trait picker in the Editor**

Inside the `Editor` component's form, remove the entire `avatarId` `<div>` block:
```tsx
// Remove this:
<div>
  <label htmlFor="avatarId" ...>Avatar ID</label>
  <input type="text" name="avatarId" ... />
</div>
```

Replace it with the full trait picker + preview layout:

```tsx
<div>
  <label className="block text-sm font-semibold text-slate-300 mb-3">Avatar</label>
  <div className="flex gap-8">
    {/* Left: controls */}
    <div className="flex-1 space-y-4">

      {/* Eyes */}
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

      {/* Mouth */}
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

      {/* Hair */}
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

      {/* Skin Color */}
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

      {/* Hair Color */}
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

      {/* Background Color */}
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
```

- [ ] **Step 4: Check TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep PersonaStudio
```

Expected: No errors.

- [ ] **Step 5: Run the full frontend test suite**

```bash
cd frontend && npm test 2>&1 | tail -20
```

Expected: All tests pass (the pre-existing `PersonaSidebar.test.tsx` failures for wrong class names are not caused by our changes).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/PersonaStudio.tsx
git commit -m "feat: replace avatarId text field with DiceBear trait picker in PersonaStudio"
```

---

## Task 9: Final TypeScript and integration check

**Files:** (read-only verification)

- [ ] **Step 1: Full TypeScript clean check**

```bash
cd frontend && npx tsc --noEmit 2>&1
```

Expected: Zero errors referencing `avatarId` anywhere. Any pre-existing errors unrelated to this feature are acceptable.

- [ ] **Step 2: Run full backend test suite**

```bash
cd /home/toryhebert/src/agent-manager && python -m pytest tests/backend/ -v 2>&1 | tail -20
```

Expected: All tests PASS.

- [ ] **Step 3: Run full frontend test suite**

```bash
cd frontend && npm test 2>&1 | tail -20
```

Expected: `AgentAvatar` tests pass. `PersonaSidebar` tests may have pre-existing failures unrelated to this feature (wrong class name assertions) — those are not regressions.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete DiceBear pixel-art avatar integration"
```
