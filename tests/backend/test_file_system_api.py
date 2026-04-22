# tests/backend/test_file_system_api.py
import pytest
from fastapi.testclient import TestClient
from backend.main import app # Assuming app is imported from main for testing

client = TestClient(app)

def test_list_directory_success():
    response = client.post("/api/fs/list", json={"path": "/"})
    assert response.status_code == 200
    assert "contents" in response.json()
    assert isinstance(response.json()["contents"], list)
    # Add more specific assertions for expected directory content if possible

def test_list_directory_non_existent():
    response = client.post("/api/fs/list", json={"path": "/non_existent_path_12345"})
    assert response.status_code == 200
    assert response.json()["contents"] == []

def test_list_directory_is_file():
    # Assuming there's a file at the root, e.g., /etc/hosts on Linux
    # This test might need adjustment based on the OS where it's run
    response = client.post("/api/fs/list", json={"path": "/etc/hosts"})
    assert response.status_code == 200
    assert response.json()["contents"] == [] # Should return empty if it's a file
