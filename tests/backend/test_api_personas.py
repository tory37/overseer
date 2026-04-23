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
