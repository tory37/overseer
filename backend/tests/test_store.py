import json
import pytest
from pathlib import Path
from unittest.mock import patch

from backend.store import Store, SessionTab, Config


@pytest.fixture
def tmp_store(tmp_path, monkeypatch):
    config_file = tmp_path / ".overseer.json"
    monkeypatch.setattr("backend.store.CONFIG_PATH", config_file)
    store = Store()
    return store, config_file


def test_delete_session_removes_entry(tmp_store):
    store, config_file = tmp_store
    store.config.sessions = [
        SessionTab(id="aaa", name="session-a"),
        SessionTab(id="bbb", name="session-b"),
    ]
    store.save()

    store.delete_session("aaa")

    assert len(store.config.sessions) == 1
    assert store.config.sessions[0].id == "bbb"


def test_delete_session_persists_to_disk(tmp_store):
    store, config_file = tmp_store
    store.config.sessions = [SessionTab(id="aaa", name="session-a")]
    store.save()

    store.delete_session("aaa")

    data = json.loads(config_file.read_text())
    assert all(s["id"] != "aaa" for s in data["sessions"])


def test_delete_session_noop_when_missing(tmp_store):
    store, _ = tmp_store
    store.config.sessions = [SessionTab(id="aaa", name="session-a")]
    store.save()

    store.delete_session("nonexistent")

    assert len(store.config.sessions) == 1
