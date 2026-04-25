import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

CONFIG_PATH = Path.home() / ".overseer.json"

BUILTIN_AVATAR_CONFIGS = {
    "senior": {"eyes": "variant09", "mouth": "sad04", "hair": "short01", "skinColor": "f5cba7", "hairColor": "6b6b6b", "backgroundColor": "1e293b", "clothingColor": "4a5568", "clothing": "variant05", "glasses": "", "beard": "", "hat": "", "accessories": ""},
    "intern": {"eyes": "variant01", "mouth": "happy10", "hair": "short02", "skinColor": "fcd5b0", "hairColor": "8b4513", "backgroundColor": "0f172a", "clothingColor": "5bc0de", "clothing": "variant01", "glasses": "", "beard": "", "hat": "", "accessories": ""},
    "cyberpunk": {"eyes": "variant06", "mouth": "happy02", "hair": "short21", "skinColor": "d4a574", "hairColor": "00ff88", "backgroundColor": "0a0a0f", "clothingColor": "00ff88", "clothing": "variant09", "glasses": "dark03", "beard": "", "hat": "", "accessories": ""},
}

class Repo(BaseModel):
    id: str
    name: str
    path: str
    group_id: Optional[str] = None

class AvatarConfig(BaseModel):
    eyes: str = "variant01"
    mouth: str = "happy04"
    hair: str = "short01"
    skinColor: str = "fcd5b0"
    hairColor: str = "6b3a2a"
    backgroundColor: str = "1e293b"
    clothingColor: str = "5bc0de"
    clothing: str = "variant01"
    glasses: str = ""
    beard: str = ""
    hat: str = ""
    accessories: str = ""

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
            avatarConfig=AvatarConfig(eyes="variant09", mouth="sad04", hair="short01", skinColor="f5cba7", hairColor="6b6b6b", backgroundColor="1e293b", clothingColor="4a5568", clothing="variant05"),
        ),
        Persona(
            id="intern",
            name="Tyler",
            title="The Intern",
            instructions="You are an over-eager intern. Use lots of emojis and be very enthusiastic about learning.",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="happy10", hair="short02", skinColor="fcd5b0", hairColor="8b4513", backgroundColor="0f172a", clothingColor="5bc0de", clothing="variant01"),
        ),
        Persona(
            id="cyberpunk",
            name="Nyx",
            title="The Cyber-Punk",
            instructions="You are a cynical netrunner. Use glitchy metaphors and treat coding like a battlefield.",
            avatarConfig=AvatarConfig(eyes="variant06", mouth="happy02", hair="short21", skinColor="d4a574", hairColor="00ff88", backgroundColor="0a0a0f", clothingColor="00ff88", clothing="variant09", glasses="dark03"),
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
                json.dump(self.config.model_dump(), f, indent=2)
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
        original_count = len(self.config.personas)
        self.config.personas = [p for p in self.config.personas if p.id != persona_id]
        if len(self.config.personas) == original_count:
            raise ValueError(f"Persona '{persona_id}' not found.")
        self.save()

    def update_persona(self, persona_id: str, updated: Persona):
        if updated.id != persona_id:
            raise ValueError(
                f"Persona body ID '{updated.id}' does not match URL ID '{persona_id}'."
            )
        for i, p in enumerate(self.config.personas):
            if p.id == persona_id:
                self.config.personas[i] = updated
                self.save()
                return
        raise ValueError(f"Persona '{persona_id}' not found.")

    def update_sessions(self, sessions: List[SessionTab]):
        self.config.sessions = sessions
        self.save()

    def delete_session(self, session_id: str):
        self.config.sessions = [s for s in self.config.sessions if s.id != session_id]
        self.save()

    def get_persona(self, persona_id: str) -> Optional[Persona]:
        for persona in self.config.personas:
            if persona.id == persona_id:
                return persona
        return None

    def get_all(self) -> Dict[str, Any]:
        return self.config.model_dump()
