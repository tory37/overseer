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

def test_persona_model_structure():
    persona_data = {
        "id": "test",
        "name": "Test Persona",
        "instructions": "These are test instructions.",
        "avatarId": "test-avatar"
    }
    persona = Persona(**persona_data)
    assert persona.id == "test"
    assert persona.name == "Test Persona"
    assert persona.instructions == "These are test instructions."
    assert persona.avatarId == "test-avatar"

def test_get_persona(temp_store):
    store = temp_store
    
    # Add a new persona
    new_persona = Persona(id="getter", name="Getter Persona", instructions="Get me.", avatarId="getter-1")
    store.add_persona(new_persona)
    
    # Retrieve the persona
    retrieved_persona = store.get_persona("getter")
    assert retrieved_persona is not None
    assert retrieved_persona.id == "getter"
    assert retrieved_persona.name == "Getter Persona"
    assert retrieved_persona.instructions == "Get me."
    assert retrieved_persona.avatarId == "getter-1"
    
    # Try to retrieve a non-existent persona
    non_existent_persona = store.get_persona("non-existent")
    assert non_existent_persona is None
