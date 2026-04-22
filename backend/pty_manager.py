import os
import shlex
import shutil
from ptyprocess import PtyProcess

class PtyManager:
    def __init__(self, command: str = "/bin/bash", cwd: str = None):
        if isinstance(command, str):
            args = shlex.split(command)
        else:
            args = command
            
        executable = shutil.which(args[0])
        if executable:
            args[0] = executable
            
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
