from backend.session_manager import SessionManager
from backend.pty_manager import PtyManager

def test_session_manager_registration():
    sm = SessionManager()
    pty = PtyManager(command="bash")
    sm.register("test-session", pty)
    assert sm.get("test-session") == pty
    sm.unregister("test-session")
    assert sm.get("test-session") is None

def test_session_manager_singleton():
    sm1 = SessionManager()
    sm2 = SessionManager()
    assert sm1 is sm2

def test_session_manager_prune_stale():
    import time
    sm = SessionManager()
    pty = PtyManager(command="bash")
    sm.register("stale-session", pty)
    
    # Manually backdate last_accessed
    sm._sessions["stale-session"]["last_accessed"] = time.time() - 100
    
    sm.prune_stale(50)
    assert sm.get("stale-session") is None

def test_session_manager_unregister_stops_pty():
    sm = SessionManager()
    pty = PtyManager(command="sleep 100")
    pty.start()
    assert pty.is_alive()
    sm.register("to-stop", pty)
    sm.unregister("to-stop")
    assert not pty.is_alive()
