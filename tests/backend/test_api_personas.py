import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_personas():
    response = client.get("/api/personas")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Default personas should be there
    assert len(data) >= 3
    persona_ids = [p["id"] for p in data]
    assert "senior" in persona_ids
    assert "intern" in persona_ids
    assert "cyberpunk" in persona_ids

def test_create_persona():
    new_persona = {
        "id": "test-bot",
        "name": "Test Bot",
        "instructions": "Be a bot for testing.",
        "avatarId": "bot-1"
    }
    response = client.post("/api/personas", json=new_persona)
    assert response.status_code == 200
    assert response.json() == new_persona

    # Verify it was added
    response = client.get("/api/personas")
    assert response.status_code == 200
    persona_ids = [p["id"] for p in response.json()]
    assert "test-bot" in persona_ids

import unittest.mock as mock
from backend.session_manager import SessionManager, Persona

@mock.patch.object(SessionManager, 'create_session')
def test_create_session_with_persona_id(mock_create_session):
    mock_create_session.return_value = "mock-session-id-with-persona" # Return a simple string
    # Ensure a persona exists in the store for the test
    persona_id = "test-persona-session"
    test_persona = Persona(
        id=persona_id,
        name="Test Session Persona",
        instructions="Instructions for session.",
        avatarId="session-1"
    )
    # Use the actual store instance from main.py
    from backend.main import store
    store.add_persona(test_persona)

    new_session_request = {
        "name": "Test Session with Persona",
        "cwd": "/tmp",
        "personaId": persona_id
    }
    response = client.post("/api/sessions", json=new_session_request)
    assert response.status_code == 200
    assert response.json() == {"id": "mock-session-id-with-persona"} # Assert against the mocked return value

    mock_create_session.assert_called_once()
    args, kwargs = mock_create_session.call_args
    assert args[0] == new_session_request["name"]
    assert args[1] == new_session_request["cwd"]
    assert isinstance(args[2], Persona)
    assert args[2].id == persona_id
    assert args[2].name == test_persona.name

@mock.patch.object(SessionManager, 'create_session')
def test_create_session_without_persona_id(mock_create_session):
    mock_create_session.return_value = "mock-session-id-without-persona" # Return a simple string
    new_session_request = {
        "name": "Test Session without Persona",
        "cwd": "/tmp"
    }
    response = client.post("/api/sessions", json=new_session_request)
    assert response.status_code == 200
    assert response.json() == {"id": "mock-session-id-without-persona"} # Assert against the mocked return value

    mock_create_session.assert_called_once()
    args, kwargs = mock_create_session.call_args
    assert args[0] == new_session_request["name"]
    assert args[1] == new_session_request["cwd"]
    assert args[2] is None
