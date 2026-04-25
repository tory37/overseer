import pytest
import anyio
import asyncio
import time
from backend.session_manager import SessionManager
from backend.pty_manager import PtyManager

@pytest.fixture(autouse=True)
async def cleanup_sessions():
    yield
    SessionManager().clear()

@pytest.mark.anyio
async def test_session_manager_registration():
    sm = SessionManager()
    pty = PtyManager(session_id="test-reg", command="bash")
    sm.register("test-reg", pty)
    session = sm.get_session("test-reg")
    assert session is not None
    assert session.pty == pty
    sm.unregister("test-reg")
    assert sm.get_session("test-reg") is None

@pytest.mark.anyio
async def test_session_manager_singleton():
    sm1 = SessionManager()
    sm2 = SessionManager()
    assert sm1 is sm2

@pytest.mark.anyio
async def test_session_manager_prune_stale():
    sm = SessionManager()
    pty = PtyManager(session_id="stale-session", command="bash")
    sm.register("stale-session", pty)
    
    session = sm.get_session("stale-session")
    # Manually backdate last_accessed
    session.last_accessed = time.time() - 100
    
    sm.prune_stale(50)
    assert sm.get_session("stale-session") is None

@pytest.mark.anyio
async def test_session_manager_unregister_stops_pty():
    sm = SessionManager()
    pty = PtyManager(session_id="to-stop", command="sleep 100")
    pty.start()
    assert pty.is_alive()
    sm.register("to-stop", pty)
    sm.unregister("to-stop")
    # Small sleep to allow process to terminate
    await anyio.sleep(0.1)
    assert not pty.is_alive()

@pytest.mark.anyio
async def test_session_subscription():
    sm = SessionManager()
    # Use a command that continuously outputs data until killed
    # This avoids any race where the process finishes before we subscribe
    pty = PtyManager(session_id="sub-test", command="sh -c 'while true; do echo ready; sleep 0.1; done'")
    pty.start()
    sm.register("sub-test", pty)
    session = sm.get_session("sub-test")
    
    buffer, queue = await session.subscribe()
    
    # Wait for data from pty
    found = False
    try:
        with anyio.fail_after(5.0):
            while not found:
                data = await queue.get()
                if b"ready" in data:
                    found = True
    except TimeoutError:
        pytest.fail("Timed out waiting for 'ready' in PTY output")
    
    assert found
    session.unsubscribe(queue)
    sm.unregister("sub-test")

@pytest.mark.anyio
async def test_session_manager_create_session_custom_id():
    sm = SessionManager()
    custom_id = "my-custom-id"
    await sm.create_session(name="Test", cwd="/tmp", command="echo hello", session_id=custom_id)
    session = sm.get_session(custom_id)
    assert session is not None
    assert session.session_id == custom_id
    sm.unregister(custom_id)
