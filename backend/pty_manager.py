import os
import shlex
import shutil
import logging
from collections import deque
from ptyprocess import PtyProcess

logger = logging.getLogger(__name__)

class PtyManager:
    def __init__(self, command: str = None, cwd: str = None, env: dict = None, use_shell: bool = True, rows: int = 24, cols: int = 80):
        # Detect default shell
        shell_executable = shutil.which(os.environ.get("SHELL", "bash")) or "/bin/bash"
        
        if not use_shell and command:
            if isinstance(command, list):
                args = command
            else:
                args = shlex.split(command)
        # If no command or just requesting a shell, start an interactive shell
        elif not command or command in ["/bin/bash", "/bin/zsh", "bash", "zsh"]:
            args = [shell_executable, "-i"]
        else:
            # Wrap the command in the shell with -ic to source dotfiles
            if isinstance(command, list):
                command_str = shlex.join(command)
            else:
                command_str = command
            args = [shell_executable, "-ic", command_str]
            
        self.command = args
        self.cwd = cwd or os.getcwd()
        self.env = env
        self.rows = rows
        self.cols = cols
        self.process = None
        self.buffer = deque(maxlen=50)

    def start(self):
        logger.info(f"PtyManager: Starting command: {self.command}, in cwd: {self.cwd}, size: {self.rows}x{self.cols}")
        if self.env:
            path = self.env.get("PATH", "not set")
            logger.debug(f"PtyManager: PATH in environment: {path}")
        else:
            logger.debug(f"PtyManager: environment not set, using default.")
        
        try:
            self.process = PtyProcess.spawn(self.command, cwd=self.cwd, env=self.env, dimensions=(self.rows, self.cols))
            logger.info(f"PtyManager: Process spawned with PID: {self.process.pid}")
            
            # Short check to see if it died immediately
            import time
            time.sleep(0.1)
            if not self.process.isalive():
                logger.warning(f"PtyManager: Process {self.process.pid} died immediately after spawning with exit status {self.process.exitstatus}")
        except Exception as e:
            logger.error(f"PtyManager: Failed to spawn process: {e}", exc_info=True)
            raise

    def read(self, max_bytes: int = 1024) -> bytes:
        if not self.process:
            return b""
        try:
            data = self.process.read(max_bytes)
            if data:
                self.buffer.append(data)
            return data
        except EOFError:
            logger.info(f"PtyManager: EOFError received from process {getattr(self.process, 'pid', 'unknown')}. Process likely terminated.")
            return b""
        except Exception as e:
            logger.error(f"PtyManager: Error reading from process: {e}")
            return b""

    def read_raw(self, max_bytes: int = 1024) -> bytes:
        """Read from the process without updating the internal buffer."""
        if not self.process:
            return b""
        try:
            return self.process.read(max_bytes)
        except (EOFError, Exception):
            return b""

    def append_to_buffer(self, data: bytes):
        """Manually append data to the internal buffer."""
        if data:
            self.buffer.append(data)

    def get_buffer(self) -> bytes:
        return b"".join(self.buffer)

    def write(self, data: str):
        if self.process:
            self.process.write(data.encode())

    def resize(self, rows: int, cols: int):
        if self.process:
            self.process.setwinsize(rows, cols)

    def is_alive(self) -> bool:
        if self.process:
            alive = self.process.isalive()
            if not alive and self.process.exitstatus is not None:
                logger.info(f"PtyManager: Process {self.process.pid} is not alive. Exit status: {self.process.exitstatus}, Signal: {self.process.signalstatus}")
            return alive
        return False

    def stop(self):
        if self.process:
            pid = self.process.pid
            self.process.terminate(force=True)
            self.process.wait() # Wait for the process to truly exit
            logger.info(f"PtyManager: Process {pid} terminated. Exit status: {self.process.exitstatus}, Signal: {self.process.signalstatus}")
