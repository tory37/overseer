import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

CONFIG_PATH = Path.home() / ".agent-manager.json"

class Repo(BaseModel):
    id: str
    name: str
    path: str
    group_id: Optional[str] = None

class Group(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None

class Config(BaseModel):
    repos: List[Repo] = []
    groups: List[Group] = []

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

    def get_all(self) -> Dict[str, Any]:
        return self.config.dict()
