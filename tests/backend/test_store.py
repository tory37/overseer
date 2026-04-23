import os
import json
import pytest
from pathlib import Path
from backend.store import Store, Persona, Repo, Config
import backend.store

@pytest.fixture
def temp_store(tmp_path):
    # Mock CONFIG_PATH to a temporary file
    original_path = backend.store.CONFIG_PATH
    temp_config = tmp_path / ".overseer.json"
    backend.store.CONFIG_PATH = temp_config
    
    yield Store()
    
    # Restore original path
    backend.store.CONFIG_PATH = original_path

def test_persona_defaults(temp_store):
    store = temp_store
    assert hasattr(store.config, "personas")
    assert len(store.config.personas) == 3
    
    senior = next((p for p in store.config.personas if p.id == "senior"), None)
    assert senior is not None
    assert senior.name == "The Senior"
    assert "grumpy senior engineer" in senior.instructions
    assert senior.avatarId == "senior-1"

def test_add_persona(temp_store):
    store = temp_store
    new_persona = Persona(id="custom", name="Custom", instructions="Be helpful.", avatarId="custom-1")
    store.config.personas.append(new_persona)
    assert len(store.config.personas) == 4
    
    # Verify it persists
    store.save()
    
    # Create a new store instance to load from the file
    new_store = Store()
    assert len(new_store.config.personas) == 4
    custom = next((p for p in new_store.config.personas if p.id == "custom"), None)
    assert custom is not None
    assert custom.name == "Custom"
