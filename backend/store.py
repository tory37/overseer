import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

CONFIG_PATH = Path.home() / ".overseer.json"

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

class Persona(BaseModel):
    id: str
    name: str
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

class Store:
    def __init__(self):
        self.config = self._load()

    def _load(self) -> Config:
        if not CONFIG_PATH.exists():
            return Config()
        try:
            with open(CONFIG_PATH, "r") as f:
                data = json.load(f)
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
