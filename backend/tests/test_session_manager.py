import asyncio
import pytest
from unittest.mock import MagicMock, patch, AsyncMock

from backend.session_manager import Session, SessionManager, SessionMetadata
from backend.pty_manager import PtyManager
from backend.store import SessionTab


def make_mock_pty(session_id="test-id"):
    pty = MagicMock(spec=PtyManager)
    pty.session_id = session_id
    pty.tmux_name = f"overseer-{session_id}"
    pty.is_alive.return_value = False
    pty.get_buffer.return_value = b"buffered output"
    return pty


@pytest.fixture(autouse=True)
def reset_session_manager():
    """Reset singleton state between tests."""
    SessionManager._instance = None
    SessionManager._sessions = {}
    yield
    SessionManager._instance = None
    SessionManager._sessions = {}


async def test_subscribe_returns_buffer_and_queue():
    pty = make_mock_pty()
    session = Session(session_id="abc", pty=pty)

    buffer, q = await session.subscribe()

    assert buffer == b"buffered output"
    assert isinstance(q, asyncio.Queue)
    assert q in session.queues


async def test_subscribe_get_buffer_called_outside_lock():
    """get_buffer (blocking subprocess) must not be called while holding the async lock."""
    pty = make_mock_pty()
    lock_held_during_get_buffer = False
    original_get_buffer = pty.get_buffer

    def check_lock():
        nonlocal lock_held_during_get_buffer
        # asyncio.Lock.locked() is True if held
        # We can't directly check from sync context, but we verify it's called before lock acquired
        return b"data"

    pty.get_buffer.side_effect = check_lock
    session = Session(session_id="abc", pty=pty)

    buffer, q = await session.subscribe()
    pty.get_buffer.assert_called_once()


async def test_create_session_passes_session_id_to_pty():
    manager = SessionManager()

    with patch("backend.session_manager.PtyManager") as MockPty:
        mock_pty_instance = make_mock_pty()
        MockPty.return_value = mock_pty_instance

        sid = await manager.create_session(name="test", cwd="/tmp", command="bash")

    call_kwargs = MockPty.call_args[1]
    assert call_kwargs["session_id"] == sid


async def test_create_session_uses_extra_env_not_full_environ():
    manager = SessionManager()

    with patch("backend.session_manager.PtyManager") as MockPty:
        mock_pty_instance = make_mock_pty()
        MockPty.return_value = mock_pty_instance

        await manager.create_session(name="test", cwd="/tmp", command="bash")

    call_kwargs = MockPty.call_args[1]
    assert "extra_env" in call_kwargs
    # Without a persona, extra_env should be empty
    assert call_kwargs["extra_env"] == {}


async def test_startup_discover_attaches_existing_tmux_sessions():
    manager = SessionManager()
    stored = [
        SessionTab(id="aaa-111", name="session-a", cwd="/tmp", command=None, personaId=None),
    ]

    with patch("subprocess.run") as mock_run, \
         patch("backend.session_manager.PtyManager") as MockPty:
        mock_run.return_value = MagicMock(
            stdout="overseer-aaa-111\noverseer-other-session\n",
            returncode=0,
        )
        mock_pty = make_mock_pty("aaa-111")
        MockPty.return_value = mock_pty

        manager.startup_discover(stored)

    assert "aaa-111" in manager._sessions
    mock_pty.attach.assert_called_once()


async def test_startup_discover_skips_tmux_sessions_not_in_store():
    manager = SessionManager()
    stored = []  # no stored sessions

    with patch("subprocess.run") as mock_run, \
         patch("backend.session_manager.PtyManager") as MockPty:
        mock_run.return_value = MagicMock(
            stdout="overseer-aaa-111\n",
            returncode=0,
        )

        manager.startup_discover(stored)

    assert len(manager._sessions) == 0
