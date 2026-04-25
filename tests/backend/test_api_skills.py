import pytest
from fastapi.testclient import TestClient
import os
import shutil
from backend.main import app, store
from backend.store import Config

client = TestClient(app)

@pytest.fixture
def temp_skills_dir(tmp_path):
    skills_dir = tmp_path / "skills"
    skills_dir.mkdir()
    
    import backend.main
    original_dir = backend.main.store.config.skills_directory
    backend.main.store.config.skills_directory = str(skills_dir)
    
    yield skills_dir
    
    backend.main.store.config.skills_directory = original_dir

def test_create_skill(temp_skills_dir):
    payload = {
        "name": "Test Skill",
        "content": "# Test Content",
        "category": "workflows",
        "description": "A test skill"
    }
    response = client.post("/api/skills", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "workflows/test-skill.md"
    
    # Verify file exists
    file_path = temp_skills_dir / "workflows" / "test-skill.md"
    assert file_path.exists()
    assert file_path.read_text() == "# Test Content"

def test_create_skill_no_config():
    original_dir = store.config.skills_directory
    store.config.skills_directory = None
    try:
        payload = {
            "name": "Test Skill",
            "content": "# Test Content"
        }
        response = client.post("/api/skills", json=payload)
        assert response.status_code == 400
        assert "not configured" in response.json()["detail"]
    finally:
        store.config.skills_directory = original_dir

def test_update_skill(temp_skills_dir):
    # Create a skill first
    skill_path = temp_skills_dir / "test.md"
    skill_path.write_text("old content")
    
    payload = {
        "name": "Test",
        "content": "new content"
    }
    response = client.put("/api/skills/test.md", json=payload)
    assert response.status_code == 200
    assert skill_path.read_text() == "new content"

def test_update_skill_rename(temp_skills_dir):
    # Create a skill first
    skill_path = temp_skills_dir / "old.md"
    skill_path.write_text("content")
    
    payload = {
        "name": "New Name",
        "content": "new content",
        "category": "new-cat"
    }
    response = client.put("/api/skills/old.md", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "new-cat/new-name.md"
    
    # Verify old file is gone, new file exists
    assert not (temp_skills_dir / "old.md").exists()
    assert (temp_skills_dir / "new-cat" / "new-name.md").exists()
    assert (temp_skills_dir / "new-cat" / "new-name.md").read_text() == "new content"

def test_list_skills(temp_skills_dir):
    (temp_skills_dir / "skill1.md").write_text("# Skill 1")
    os.makedirs(temp_skills_dir / "cat1")
    (temp_skills_dir / "cat1" / "skill2.md").write_text("# Skill 2")
    
    response = client.get("/api/skills")
    assert response.status_code == 200
    skills = response.json()
    assert len(skills) == 2
    
    names = [s["name"] for s in skills]
    assert "skill1" in names
    assert "skill2" in names
