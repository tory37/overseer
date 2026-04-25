import pytest
from backend.pty_manager import PtyManager
import time
import os

def test_pty_buffer_stores_output():
    # Use /bin/sh to avoid .bashrc noise/prompts
    os.environ["SHELL"] = "/bin/sh"
    pty = PtyManager(session_id="test-session", command="echo 'hello world'; sleep 10")
    pty.start()
    
    # Wait and read multiple times to ensure we get the output
    found = False
    for _ in range(10):
        data = pty.read_raw()
        if b"hello world" in pty.get_buffer():
            found = True
            break
        time.sleep(0.1)
        
    assert found, f"Buffer content: {pty.get_buffer()}"
    pty.stop()
