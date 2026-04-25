import os
import json
import pytest
from pathlib import Path
from backend.store import Store, Persona, Repo, Config
import backend.store

@pytest.fixture
def temp_store(tmp_path):
    original_path = backend.store.CONFIG_PATH
    temp_config = tmp_path / ".overseer.json"
    backend.store.CONFIG_PATH = temp_config
    yield Store()
    backend.store.CONFIG_PATH = original_path

def test_persona_defaults(temp_store):
    store = temp_store
    assert hasattr(store.config, "personas")
    assert len(store.config.personas) == 15

    sailor = next((p for p in store.config.personas if p.id == "sailor"), None)
    assert sailor is not None
    assert sailor.title == "The Salty Sailor"
    assert sailor.name == "Barnaby"
    assert "old sea dog" in sailor.instructions
    assert hasattr(sailor, "avatarConfig")

def test_add_persona(temp_store):
    store = temp_store
    new_persona = Persona(id="custom", name="Alex", title="The Helper", instructions="Be helpful.")
    store.config.personas.append(new_persona)
    assert len(store.config.personas) == 16

    store.save()
    new_store = Store()
    assert len(new_store.config.personas) == 16
    custom = next((p for p in new_store.config.personas if p.id == "custom"), None)
    assert custom is not None
    assert custom.name == "Alex"
    assert custom.title == "The Helper"

def test_persona_model_structure():
    persona_data = {
        "id": "test",
        "name": "Sam",
        "title": "Test Persona",
        "instructions": "These are test instructions.",
    }
    persona = Persona(**persona_data)
    assert persona.id == "test"
    assert persona.name == "Sam"
    assert persona.title == "Test Persona"
    assert persona.instructions == "These are test instructions."
    assert hasattr(persona, "avatarConfig")

def test_get_persona(temp_store):
    store = temp_store
    new_persona = Persona(id="getter", name="Jo", title="Getter Persona", instructions="Get me.")
    store.add_persona(new_persona)
    retrieved = store.get_persona("getter")
    assert retrieved is not None
    assert retrieved.id == "getter"
    assert retrieved.name == "Jo"
    assert retrieved.title == "Getter Persona"

    assert store.get_persona("non-existent") is None

def test_avatar_config_defaults():
    from backend.store import AvatarConfig
    config = AvatarConfig()
    assert config.eyes == "variant01"
    assert config.mouth == "happy04"
    assert config.hair == "short01"
    assert config.skinColor == "fcd5b0"
    assert config.hairColor == "6b3a2a"
    assert config.backgroundColor == "1e293b"
    assert config.clothingColor == "5bc0de"

def test_persona_has_avatar_config():
    from backend.store import Persona, AvatarConfig
    p = Persona(id="x", name="X", title="Role X", instructions="Be X.")
    assert isinstance(p.avatarConfig, AvatarConfig)
    assert p.avatarConfig.eyes == "variant01"
    assert p.avatarConfig.clothingColor == "5bc0de"

def test_delete_persona(temp_store):
    store = temp_store
    new_persona = Persona(id="to-delete", name="Del", title="Deletable", instructions="Gone soon.")
    store.add_persona(new_persona)
    assert store.get_persona("to-delete") is not None
    store.delete_persona("to-delete")
    assert store.get_persona("to-delete") is None

def test_update_persona(temp_store):
    store = temp_store
    updated = Persona(id="sailor", name="Barnaby II", title="The Saltiest Sailor", instructions="Updated instructions.")
    store.update_persona("sailor", updated)
    retrieved = store.get_persona("sailor")
    assert retrieved.name == "Barnaby II"
    assert retrieved.instructions == "Updated instructions."

def test_update_persona_not_found(temp_store):
    store = temp_store
    with pytest.raises(ValueError, match="'ghost' not found"):
        store.update_persona("ghost", Persona(id="ghost", name="Ghost", title="Ghost", instructions="Boo."))

def test_delete_persona_not_found(temp_store):
    store = temp_store
    with pytest.raises(ValueError, match="'ghost' not found"):
        store.delete_persona("ghost")

def test_update_persona_id_mismatch(temp_store):
    store = temp_store
    mismatched = Persona(id="different-id", name="X", title="X", instructions="X.")
    with pytest.raises(ValueError, match="does not match"):
        store.update_persona("sailor", mismatched)

def test_migration_old_name_to_title(tmp_path):
    old_data = {
        "personas": [
            {
                "id": "legacy",
                "name": "The Legacy Bot",
                "instructions": "Old instructions.",
                "avatarConfig": {
                    "eyes": "variant01",
                    "mouth": "variant04",
                    "hair": "short01",
                    "skinColor": "fcd5b0",
                    "hairColor": "6b3a2a",
                    "backgroundColor": "1e293b"
                }
            }
        ]
    }
    config_file = tmp_path / ".overseer.json"
    config_file.write_text(json.dumps(old_data))

    original_path = backend.store.CONFIG_PATH
    backend.store.CONFIG_PATH = config_file
    try:
        store = Store()
        legacy = next((p for p in store.config.personas if p.id == "legacy"), None)
        assert legacy is not None
        assert legacy.title == "The Legacy Bot"
        assert legacy.name == ""
    finally:
        backend.store.CONFIG_PATH = original_path
