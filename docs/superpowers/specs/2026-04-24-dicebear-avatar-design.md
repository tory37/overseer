# DiceBear Pixel-Art Avatar Integration Design

## Overview

Replace the dead `avatarId: string` placeholder with a structured `AvatarConfig` object that drives deterministic DiceBear pixel-art SVG generation. Avatars appear in the sidebar (32px, replacing the Ghost icon), in the PixelAgent header (40px, animated), and in a two-column trait picker inside PersonaStudio.

---

## Section 1: Data Model

### Backend — `backend/store.py`

Add an `AvatarConfig` Pydantic model and replace `avatarId: str` on `Persona`:

```python
class AvatarConfig(BaseModel):
    eyes: str = "variant01"
    mouth: str = "variant04"
    hair: str = "short01"
    skinColor: str = "fcd5b0"
    hairColor: str = "6b3a2a"
    backgroundColor: str = "1e293b"
```

```python
class Persona(BaseModel):
    id: str
    name: str
    instructions: str
    avatarConfig: AvatarConfig = AvatarConfig()
```

### Built-in Persona Configs

| Persona | Eyes | Mouth | Hair | Skin | Hair Color | BG |
|---|---|---|---|---|---|---|
| The Senior | `variant09` | `variant14` | `short01` | `f5cba7` | `6b6b6b` | `1e293b` |
| The Intern | `variant01` | `variant04` | `short02` | `fcd5b0` | `8b4513` | `0f172a` |
| The Cyber-Punk | `variant06` | `variant09` | `mohawk01` | `d4a574` | `00ff88` | `0a0a0f` |

### Frontend — `frontend/src/utils/api.ts`

```typescript
export interface AvatarConfig {
  eyes: string;
  mouth: string;
  hair: string;
  skinColor: string;
  hairColor: string;
  backgroundColor: string;
}

export interface Persona {
  id: string;
  name: string;
  instructions: string;
  avatarConfig: AvatarConfig;
}
```

---

## Section 2: AgentAvatar Component

**File:** `frontend/src/components/AgentAvatar.tsx`

### Props

```typescript
interface AgentAvatarProps {
  avatarConfig: AvatarConfig;
  state?: 'idle' | 'talking' | 'thinking';
  talkingUntil?: number;   // epoch ms; avatar self-manages via useEffect
  size?: number;           // px, default 40
}
```

### SVG Generation

Use `useMemo` to call `createAvatar(pixelArt, { ...traits })` from `@dicebear/core` + `@dicebear/collection`. Render output as `<img src={svgDataUrl} style={{ imageRendering: 'pixelated' }} />`.

During talking state the component maintains a separate `mouthVariant` in local state, toggled between the configured variant and `variant01` every 150ms via `setInterval`. A new `talkingUntil` prop value clears the previous interval and starts a fresh one — clean restart, no stacking.

### Animation (Framer Motion)

| State | Animation |
|---|---|
| `idle` | `y: [0, -2, 0]`, duration 3s, repeat forever, ease "easeInOut" |
| `talking` | same bob as idle (mouth change is the key visual) |
| `thinking` | `opacity: [0.6, 1, 0.6]`, duration 1.2s, repeat forever |

### State Derivation (in parent components)

```typescript
const avatarState = isWorking ? 'thinking'
  : talkingUntil > Date.now() ? 'talking'
  : 'idle';
```

---

## Section 3: Sidebar Integration

**File:** `frontend/src/components/PersonaSidebar.tsx`

`PersonaGroup` currently receives `name` and `sessions`. Change it to receive the full `Persona` object (or at minimum `{ name, avatarConfig }`) so it can render `<AgentAvatar avatarConfig={persona.avatarConfig} state="idle" size={32} />` in place of the Ghost icon.

The `PersonaGroup` header button becomes:
```tsx
<AgentAvatar avatarConfig={persona.avatarConfig} state="idle" size={32} />
<span className="ml-1">{persona.name}</span>
```

For ungrouped sessions the Default Persona group uses a default `AvatarConfig()` (all defaults).

---

## Section 4: PixelAgent Integration

**File:** `frontend/src/components/PixelAgent.tsx`

- Replace `avatarId: string` prop with `avatarConfig: AvatarConfig`.
- Add `talkingUntil` local state (number, init `0`).
- `useEffect` watching `messages`: on new message, compute `wordCount` from last message text, set `talkingUntil = Date.now() + wordCount * 80`.
- Derive `avatarState` as shown above.
- Replace existing avatar image / letter fallback with `<AgentAvatar avatarConfig={avatarConfig} state={avatarState} talkingUntil={talkingUntil} size={40} />`.

---

## Section 5: Trait Picker UI (PersonaStudio)

**File:** `frontend/src/components/PersonaStudio.tsx`

Two-column layout:
- **Left column** — controls
- **Right column** — 128px live `AgentAvatar` preview with idle animation

### Controls

**Dropdowns (`<select>`)** for eyes, mouth, hair — human-readable labels mapped to variant codes:

| Eyes options | Mouth options | Hair options |
|---|---|---|
| Default (variant01) | Smile (variant04) | Short (short01) |
| Narrow (variant09) | Open (variant09) | Short Alt (short02) |
| Wide (variant06) | Grin (variant14) | Mohawk (mohawk01) |
| (more as available) | (more as available) | (more as available) |

**Color swatches** for skinColor, hairColor, backgroundColor — 6–8 preset hex values each rendered as clickable colored squares. No free-form hex input.

Preset skin tones: `fcd5b0`, `f5cba7`, `d4a574`, `c68642`, `8d5524`, `4a2912`

Preset hair colors: `6b3a2a`, `8b4513`, `6b6b6b`, `f0c040`, `00ff88`, `1a1a1a`, `ff4444`, `4444ff`

Preset background colors: `1e293b`, `0f172a`, `0a0a0f`, `1a1a2e`, `0d1117`, `111827`

---

## Architecture Notes

- **No global context.** `AgentAvatar` is self-contained with local animation state.
- **Dependencies to install:** `@dicebear/core`, `@dicebear/collection`, `framer-motion`
- **`image-rendering: pixelated`** applied to all avatar `<img>` elements for crisp pixel art.
- DiceBear color values are hex strings **without** the `#` prefix.
- The backend API must serialize `avatarConfig` as a nested object; all existing `avatarId` references in both backend and frontend must be removed.

---

## Testing

- Verify avatar renders correctly at 32px (sidebar) and 40px (PixelAgent header).
- Verify idle bob animation plays continuously.
- Verify talking animation starts on new message and stops after `wordCount × 80ms`.
- Verify thinking animation plays while `isWorking = true`.
- Verify built-in persona avatars match the defined configs visually.
- Verify trait picker live preview updates immediately on every change.
- Verify `avatarConfig` persists after saving a persona (round-trip through backend API).
