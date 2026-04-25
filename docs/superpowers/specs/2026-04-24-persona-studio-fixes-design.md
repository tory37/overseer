# Persona Studio Bug Fixes Design
**Date:** 2026-04-24

## Overview

Four bugs to fix in Persona Studio: focus loss on typing, missing clothing color picker, name/title data model split, and broken delete/update API routes.

---

## Bug 1: Focus Loss on Typing (Re-render Anti-Pattern)

**Root cause:** `Sidebar` and `Editor` are defined as function components *inside* `PersonaStudio`. React treats them as new component types on every render, causing unmount/remount on each keystroke.

**Fix:** Inline their JSX directly in the `PersonaStudio` return statement, eliminating the inner component definitions entirely. No functional changes — just restructure so no new function references are created per render.

---

## Bug 2: Clothing Color Picker

**Root cause:** `clothingColor` is not in `AvatarConfig` (frontend interface, backend Pydantic model) and is not passed to `createAvatar()`.

**Fix:**
- Add `clothingColor: string` to `AvatarConfig` in `frontend/src/utils/api.ts`
- Add `clothingColor: str = "5bc0de"` default to `AvatarConfig` in `backend/store.py`
- Pass `clothingColor` to `createAvatar()` in `AgentAvatar.tsx`
- Add a color swatch picker row (matching pattern of skinColor/hairColor) in `PersonaStudio.tsx`
- Update `DEFAULT_AVATAR_CONFIG` in `api.ts` with the default value
- Update all three predefined personas in `store.py` with clothing colors

---

## Bug 3: Name + Title Split (Option B)

**Data model change:**
- Rename existing `name` field to `title` (the role label, e.g. "The Senior")
- Add new `name` field for personal name (e.g. "Walt")

**Predefined persona names:**
| id | title | name |
|---|---|---|
| senior | The Senior | Walt |
| intern | The Intern | Tyler |
| cyberpunk | The Cyber-Punk | Nyx |

**AI prompt injection** (`session_manager.py`):
```python
f"Your name is {persona.name}. Your title is {persona.title}. {persona.instructions}"
```

**Sidebar display:** Show `{persona.name} — {persona.title}` (e.g. "Walt — The Senior")

**Form:** Two text fields — "Name" (personal) and "Title" (role) — in that order.

**Migration in `Store._load()`:** If a stored persona has no `title` field but has a `name` field that looks like a role label (or just as a safe migration), treat the old `name` value as `title` and leave `name` blank. Given the predefined personas will have correct values in the default `Config`, only user-created personas from old data need migration: copy `name` → `title`, set `name = ""`.

---

## Bug 4: Missing DELETE + PUT Backend Routes

**Root cause:** `backend/main.py` has `GET /api/personas` and `POST /api/personas` but is missing `DELETE /api/personas/{id}` and `PUT /api/personas/{id}`. `backend/store.py` has `add_persona()` but is missing `delete_persona()` and `update_persona()`.

**Fix — `store.py`:**
```python
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
```

**Fix — `main.py`:**
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

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/components/PersonaStudio.tsx` | Inline Sidebar/Editor JSX; add name+title fields; add clothingColor swatch picker |
| `frontend/src/utils/api.ts` | Add `clothingColor` to `AvatarConfig`; add `name`+`title` to `Persona`; update `DEFAULT_AVATAR_CONFIG` |
| `frontend/src/components/AgentAvatar.tsx` | Pass `clothingColor` to `createAvatar()` |
| `backend/store.py` | Add `clothingColor` + `name`+`title` to models; add `delete_persona()`/`update_persona()`; update predefined personas; migration logic |
| `backend/main.py` | Add `DELETE /api/personas/{id}` and `PUT /api/personas/{id}` routes |
| `backend/session_manager.py` | Update prompt injection string to use `persona.name` and `persona.title` |
