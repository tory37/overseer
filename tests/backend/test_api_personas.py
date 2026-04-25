import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_personas():
    response = client.get("/api/personas")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    persona_ids = [p["id"] for p in data]
    assert "senior" in persona_ids
    assert "intern" in persona_ids
    assert "cyberpunk" in persona_ids
    senior = next(p for p in data if p["id"] == "senior")
    assert "avatarConfig" in senior
    assert senior["avatarConfig"]["eyes"] == "variant09"
    assert senior["title"] == "The Senior"
    assert senior["name"] == "Walt"
    assert senior["avatarConfig"]["clothingColor"] == "4a5568"

def test_create_persona():
    new_persona = {
        "id": "test-bot",
        "name": "Bot",
        "title": "Test Bot",
        "instructions": "Be a bot for testing.",
        "avatarConfig": {
            "eyes": "variant01",
            "mouth": "variant04",
            "hair": "short01",
            "skinColor": "fcd5b0",
            "hairColor": "6b3a2a",
            "backgroundColor": "1e293b",
            "clothingColor": "5bc0de"
        }
    }
    from backend.main import store
    store.config.personas = [p for p in store.config.personas if p.id != "test-bot"]
    response = client.post("/api/personas", json=new_persona)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "test-bot"
    assert data["title"] == "Test Bot"
    assert data["name"] == "Bot"
    assert data["avatarConfig"]["clothingColor"] == "5bc0de"

    response = client.get("/api/personas")
    assert "test-bot" in [p["id"] for p in response.json()]

def test_delete_persona():
    from backend.main import store
    store.config.personas = [p for p in store.config.personas if p.id != "to-del"]
    from backend.store import Persona
    store.add_persona(Persona(id="to-del", name="Del", title="Deletable", instructions="Delete me."))

    response = client.delete("/api/personas/to-del")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    response = client.get("/api/personas")
    assert "to-del" not in [p["id"] for p in response.json()]

def test_update_persona():
    from backend.main import store
    from backend.store import Persona
    store.config.personas = [p for p in store.config.personas if p.id != "to-update"]
    store.add_persona(Persona(id="to-update", name="Old", title="Old Title", instructions="Old instructions."))

    updated_data = {
        "id": "to-update",
        "name": "New",
        "title": "New Title",
        "instructions": "Updated instructions.",
        "avatarConfig": {
            "eyes": "variant01",
            "mouth": "variant04",
            "hair": "short01",
            "skinColor": "fcd5b0",
            "hairColor": "6b3a2a",
            "backgroundColor": "1e293b",
            "clothingColor": "5bc0de"
        }
    }
    response = client.put("/api/personas/to-update", json=updated_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New"
    assert data["title"] == "New Title"
    assert data["instructions"] == "Updated instructions."

import unittest.mock as mock
from backend.session_manager import SessionManager, Persona

@mock.patch.object(SessionManager, 'create_session')
def test_create_session_with_persona_id(mock_create_session):
    mock_create_session.return_value = "mock-session-id-with-persona"
    persona_id = "test-persona-session"
    test_persona = Persona(
        id=persona_id,
        name="Test",
        title="Test Session Persona",
        instructions="Instructions for session.",
    )
    from backend.main import store
    store.config.personas = [p for p in store.config.personas if p.id != persona_id]
    store.add_persona(test_persona)

    response = client.post("/api/sessions", json={
        "name": "Test Session with Persona",
        "cwd": "/tmp",
        "personaId": persona_id
    })
    assert response.status_code == 200
    assert response.json() == {"id": "mock-session-id-with-persona"}

    mock_create_session.assert_called_once()
    args, kwargs = mock_create_session.call_args
    assert isinstance(args[2], Persona)
    assert args[2].id == persona_id

@mock.patch.object(SessionManager, 'create_session')
def test_create_session_without_persona_id(mock_create_session):
    mock_create_session.return_value = "mock-session-id-without-persona"
    response = client.post("/api/sessions", json={
        "name": "Test Session without Persona",
        "cwd": "/tmp"
    })
    assert response.status_code == 200
    assert response.json() == {"id": "mock-session-id-without-persona"}
    args, kwargs = mock_create_session.call_args
    assert args[2] is None
