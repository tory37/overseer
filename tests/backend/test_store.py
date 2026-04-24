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
    assert hasattr(senior, "avatarConfig")

def test_add_persona(temp_store):
    store = temp_store
    new_persona = Persona(id="custom", name="Custom", instructions="Be helpful.")
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
    }
    persona = Persona(**persona_data)
    assert persona.id == "test"
    assert persona.name == "Test Persona"
    assert persona.instructions == "These are test instructions."
    assert hasattr(persona, "avatarConfig")

def test_get_persona(temp_store):
    store = temp_store

    # Add a new persona
    new_persona = Persona(id="getter", name="Getter Persona", instructions="Get me.")
    store.add_persona(new_persona)

    # Retrieve the persona
    retrieved_persona = store.get_persona("getter")
    assert retrieved_persona is not None
    assert retrieved_persona.id == "getter"
    assert retrieved_persona.name == "Getter Persona"
    assert retrieved_persona.instructions == "Get me."

    # Try to retrieve a non-existent persona
    non_existent_persona = store.get_persona("non-existent")
    assert non_existent_persona is None

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
