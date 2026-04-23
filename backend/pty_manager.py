import os
import shlex
import shutil
from ptyprocess import PtyProcess

class PtyManager:
    def __init__(self, command: str = None, cwd: str = None):
        # Detect default shell
        shell_executable = shutil.which(os.environ.get("SHELL", "bash")) or "/bin/bash"
        
        # If no command or just requesting a shell, start an interactive shell
        if not command or command in ["/bin/bash", "/bin/zsh", "bash", "zsh"]:
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
        self.process = None

    def start(self):
        self.process = PtyProcess.spawn(self.command, cwd=self.cwd)

    def read(self, max_bytes: int = 1024) -> bytes:
        if not self.process:
            return b""
        try:
            return self.process.read(max_bytes)
        except EOFError:
            return b""

    def write(self, data: str):
        if self.process:
            self.process.write(data.encode())

    def resize(self, rows: int, cols: int):
        if self.process:
            self.process.setwinsize(rows, cols)

    def is_alive(self) -> bool:
        return self.process.isalive() if self.process else False

    def stop(self):
        if self.process:
            self.process.terminate(force=True)
