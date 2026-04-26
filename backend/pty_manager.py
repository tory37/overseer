import os
import shlex
import shutil
import subprocess
import logging
from ptyprocess import PtyProcess

logger = logging.getLogger(__name__)


class PtyManager:
    _TMUX_PREFIX = "overseer"

    def __init__(
        self,
        session_id: str,
        command: str = None,
        cwd: str = None,
        extra_env: dict = None,
        rows: int = 24,
        cols: int = 80,
    ):
        self.session_id = session_id
        self.tmux_name = f"{self._TMUX_PREFIX}-{session_id}"
        self.cwd = cwd or os.getcwd()
        self.extra_env = extra_env or {}
        self.rows = rows
        self.cols = cols
        self.process: PtyProcess | None = None

        shell = shutil.which(os.environ.get("SHELL", "bash")) or "/bin/bash"
        if not command or command in ("/bin/bash", "/bin/zsh", "bash", "zsh"):
            self._cmd_args = [shell, "-i"]
        else:
            cmd_str = shlex.join(command) if isinstance(command, list) else command
            self._cmd_args = [shell, "-ic", cmd_str]

    def start(self):
        new_session_cmd = [
            "tmux", "new-session",
            "-d",
            "-s", self.tmux_name,
            "-x", str(self.cols),
            "-y", str(self.rows),
            "-c", self.cwd,
        ]
        for key, val in self.extra_env.items():
            new_session_cmd += ["-e", f"{key}={val}"]
        new_session_cmd += self._cmd_args

        logger.info("PtyManager: tmux new-session: %s", new_session_cmd)
        subprocess.run(new_session_cmd, check=True)
        self._attach_pty()

    def attach(self):
        logger.info("PtyManager: attaching to existing tmux session %s", self.tmux_name)
        self._attach_pty()

    def _attach_pty(self):
        attach_cmd = ["tmux", "attach-session", "-t", self.tmux_name]
        self.process = PtyProcess.spawn(
            attach_cmd,
            dimensions=(self.rows, self.cols),
        )

    def get_buffer(self) -> bytes:
        result = subprocess.run(
            ["tmux", "capture-pane", "-t", self.tmux_name, "-p", "-S", "-5000", "-e"],
            capture_output=True,
        )
        return result.stdout

    def read_raw(self, max_bytes: int = 1024) -> bytes:
        if not self.process:
            return b""
        try:
            return self.process.read(max_bytes)
        except (EOFError, Exception):
            return b""

    def write(self, data: str):
        if self.process:
            self.process.write(data.encode())

    def resize(self, rows: int, cols: int):
        self.rows = rows
        self.cols = cols
        if self.process:
            self.process.setwinsize(rows, cols)

    def is_alive(self) -> bool:
        if self.process:
            return self.process.isalive()
        return False

    def stop(self):
        subprocess.run(
            ["tmux", "kill-session", "-t", self.tmux_name],
            check=False,
        )
        if self.process:
            try:
                self.process.terminate(force=True)
            except Exception:
                pass
        logger.info("PtyManager: stopped session %s", self.tmux_name)
