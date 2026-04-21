import subprocess
from pathlib import Path
from typing import List, Dict

class GitManager:
    @staticmethod
    def add_worktree(repo_path: str, worktree_path: str, branch: str = None) -> bool:
        cmd = ["git", "-C", repo_path, "worktree", "add", worktree_path]
        if branch:
            cmd.append(branch)
        else:
            cmd.append("-b")
            cmd.append(Path(worktree_path).name)
            
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error adding worktree: {e.stderr.decode()}")
            return False

    @staticmethod
    def remove_worktree(repo_path: str, worktree_path: str) -> bool:
        try:
            subprocess.run(["git", "-C", repo_path, "worktree", "remove", worktree_path], check=True)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error removing worktree: {e}")
            return False

    @staticmethod
    def list_worktrees(repo_path: str) -> List[Dict[str, str]]:
        try:
            result = subprocess.run(
                ["git", "-C", repo_path, "worktree", "list", "--porcelain"], 
                check=True, 
                capture_output=True, 
                text=True
            )
            worktrees = []
            current = {}
            for line in result.stdout.splitlines():
                if not line:
                    if current:
                        worktrees.append(current)
                        current = {}
                    continue
                parts = line.split(maxsplit=1)
                if len(parts) == 2:
                    current[parts[0]] = parts[1]
            if current:
                worktrees.append(current)
            return worktrees
        except subprocess.CalledProcessError:
            return []
