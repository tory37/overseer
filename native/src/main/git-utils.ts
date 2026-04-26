import { execSync } from 'child_process';
import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';

const WORKTREES_ROOT = path.join(os.homedir(), '.overseer', 'worktrees');

if (!fs.existsSync(WORKTREES_ROOT)) {
  fs.mkdirSync(WORKTREES_ROOT, { recursive: true });
}

export const GitManager = {
  addWorktree(repoPath: string, name: string, branch?: string): string | null {
    const worktreePath = path.join(WORKTREES_ROOT, name);
    let cmd = `git -C "${repoPath}" worktree add "${worktreePath}"`;
    if (branch) {
      cmd += ` "${branch}"`;
    } else {
      cmd += ` -b "${name}"`;
    }

    try {
      execSync(cmd);
      return worktreePath;
    } catch (e) {
      console.error('Error adding worktree:', e);
      return null;
    }
  },

  removeWorktree(worktreePath: string): boolean {
    try {
      execSync(`git worktree remove "${worktreePath}" --force`);
      return true;
    } catch (e) {
      console.error('Error removing worktree:', e);
      return false;
    }
  },

  listBranches(repoPath: string): string[] {
    try {
      const output = execSync(`git -C "${repoPath}" branch --format="%(refname:short)"`).toString();
      return output.split('\n').map(b => b.trim()).filter(Boolean);
    } catch (e) {
      console.error('Error listing branches:', e);
      return [];
    }
  }
};

ipcMain.handle('git-add-worktree', async (event, { repoPath, name, branch }) => {
  return GitManager.addWorktree(repoPath, name, branch);
});

ipcMain.handle('git-remove-worktree', async (event, { worktreePath }) => {
  return GitManager.removeWorktree(worktreePath);
});

ipcMain.handle('git-list-branches', async (event, { repoPath }) => {
  return GitManager.listBranches(repoPath);
});
