import subprocess
import pytest
from unittest.mock import patch, MagicMock, call

from backend.pty_manager import PtyManager


SESSION_ID = "test-1234-5678"
TMUX_NAME = f"overseer-{SESSION_ID}"


@pytest.fixture
def mgr():
    return PtyManager(session_id=SESSION_ID, command="bash", cwd="/tmp", rows=24, cols=80)


def test_tmux_name_set_on_init(mgr):
    assert mgr.tmux_name == TMUX_NAME


def test_start_runs_tmux_new_session(mgr):
    mock_proc = MagicMock()
    mock_proc.isalive.return_value = True

    with patch("subprocess.run") as mock_run, \
         patch("ptyprocess.PtyProcess.spawn", return_value=mock_proc) as mock_spawn:
        mock_run.return_value = MagicMock(returncode=0)
        mgr.start()

    new_session_call = mock_run.call_args_list[0]
    cmd = new_session_call[0][0]
    assert cmd[0] == "tmux"
    assert "new-session" in cmd
    assert "-s" in cmd
    assert TMUX_NAME in cmd


def test_start_attaches_ptyprocess(mgr):
    mock_proc = MagicMock()
    mock_proc.isalive.return_value = True

    with patch("subprocess.run") as mock_run, \
         patch("ptyprocess.PtyProcess.spawn", return_value=mock_proc) as mock_spawn:
        mock_run.return_value = MagicMock(returncode=0)
        mgr.start()

    spawn_args = mock_spawn.call_args[0][0]
    assert spawn_args[0] == "tmux"
    assert "attach-session" in spawn_args
    assert TMUX_NAME in spawn_args


def test_attach_skips_new_session(mgr):
    mock_proc = MagicMock()
    mock_proc.isalive.return_value = True

    with patch("subprocess.run") as mock_run, \
         patch("ptyprocess.PtyProcess.spawn", return_value=mock_proc):
        mgr.attach()

    mock_run.assert_not_called()


def test_get_buffer_calls_tmux_capture_pane(mgr):
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(stdout=b"hello\nworld\n", returncode=0)
        result = mgr.get_buffer()

    cmd = mock_run.call_args[0][0]
    assert "capture-pane" in cmd
    assert TMUX_NAME in cmd
    assert result == b"hello\nworld\n"


def test_stop_kills_tmux_session(mgr):
    mock_proc = MagicMock()
    mock_proc.isalive.return_value = True
    mgr.process = mock_proc

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(returncode=0)
        mgr.stop()

    kill_call = mock_run.call_args_list[0]
    cmd = kill_call[0][0]
    assert "kill-session" in cmd
    assert TMUX_NAME in cmd


def test_extra_env_injected_as_e_flags(tmp_path):
    mgr = PtyManager(
        session_id=SESSION_ID,
        command="bash",
        cwd=str(tmp_path),
        extra_env={"GEMINI_SYSTEM_MD": "/tmp/prompt.md"},
        rows=24,
        cols=80,
    )
    mock_proc = MagicMock()
    mock_proc.isalive.return_value = True

    with patch("subprocess.run") as mock_run, \
         patch("ptyprocess.PtyProcess.spawn", return_value=mock_proc):
        mock_run.return_value = MagicMock(returncode=0)
        mgr.start()

    cmd = mock_run.call_args_list[0][0][0]
    assert "-e" in cmd
    env_idx = cmd.index("-e")
    assert "GEMINI_SYSTEM_MD=/tmp/prompt.md" == cmd[env_idx + 1]
