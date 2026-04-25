import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.session_manager import SessionManager
from backend.pty_manager import PtyManager
import anyio
import os
import time

@pytest.mark.anyio
async def test_terminal_websocket_sends_buffer_on_connect():
    # Set shell to /bin/sh to avoid extra output
    os.environ["SHELL"] = "/bin/sh"
    
    # SessionManager is a singleton, let's make sure it's clear
    sm = SessionManager()
    sm.clear()
    
    session_id = f"test-buffer-{int(time.time())}"
    
    print(f"DEBUG: Starting PTY for session {session_id}")
    pty = PtyManager(session_id=session_id, command="echo 'existing data'; sleep 10")
    pty.start()
    
    # Wait for output to be produced and buffered
    found = False
    for _ in range(20):
        # Manually read to populate the buffer
        data = await anyio.to_thread.run_sync(pty.read_raw, 1024)
        if b"existing data" in pty.get_buffer():
            found = True
            break
        await anyio.sleep(0.1)
    
    assert found, f"PTY output not buffered. Buffer: {pty.get_buffer()}"
    
    # Register this PTY in the session manager
    # This will start the _read_loop task in the current event loop
    sm.register(session_id, pty)
    
    # Use TestClient as a context manager to handle the lifecycle correctly
    # TestClient can be used in async tests, but its websocket_connect is synchronous-like
    # because it uses a portal internally.
    with TestClient(app) as client:
        with client.websocket_connect(f"/ws/terminal?sessionId={session_id}") as websocket:
            # The first message should be the buffer
            data = websocket.receive_bytes()
            print(f"DEBUG: Received via WS: {data}")
            assert b"existing data" in data
            
    sm.unregister(session_id)
