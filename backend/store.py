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

class Persona(BaseModel):
    id: str
    name: str
    instructions: str
    avatarId: str

class Group(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None

class SessionTab(BaseModel):
    id: str
    name: str
    cwd: str
    command: Optional[str] = None
    active: bool = False

class Config(BaseModel):
    repos: List[Repo] = []
    groups: List[Group] = []
    sessions: List[SessionTab] = []
    personas: List[Persona] = [
        Persona(id="senior", name="The Senior", instructions="You are a grumpy senior engineer. Be brief, cynical, and obsessed with DRY and clean code.", avatarId="senior-1"),
        Persona(id="intern", name="The Intern", instructions="You are an over-eager intern. Use lots of emojis and be very enthusiastic about learning.", avatarId="intern-1"),
        Persona(id="cyberpunk", name="The Cyber-Punk", instructions="You are a cynical netrunner. Use glitchy metaphors and treat coding like a battlefield.", avatarId="cyber-1")
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

    def update_sessions(self, sessions: List[SessionTab]):
        self.config.sessions = sessions
        self.save()

    def get_all(self) -> Dict[str, Any]:
        return self.config.dict()
