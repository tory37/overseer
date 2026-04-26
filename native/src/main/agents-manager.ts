import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';

const AGENTS_DIR = path.join(os.homedir(), '.overseer', 'agents');

if (!fs.existsSync(AGENTS_DIR)) {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
}

export interface Agent {
  id: string;
  name: string;
  category: string;
  description: string;
  content: string;
}

function getAgentFiles(dir: string, baseDir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAgentFiles(file, baseDir));
    } else {
      if (file.endsWith('.md')) {
        results.push(path.relative(baseDir, file));
      }
    }
  });
  return results;
}

ipcMain.handle('agents-get-all', async () => {
  const files = getAgentFiles(AGENTS_DIR, AGENTS_DIR);
  const agents: Agent[] = files.map((file) => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    const name = path.basename(file, '.md');
    const category = path.dirname(file) === '.' ? '' : path.dirname(file);
    
    return {
      id: file,
      name,
      category,
      description: '', 
      content,
    };
  });
  return agents;
});

ipcMain.handle('agents-save', async (event, agent: Omit<Agent, 'id'> & { id?: string }) => {
  const { id, name, category, content } = agent;
  const fileName = `${name}.md`;
  const targetDir = category ? path.join(AGENTS_DIR, category) : AGENTS_DIR;
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, fileName);
  
  if (id && id !== path.relative(AGENTS_DIR, targetPath)) {
    const oldPath = path.join(AGENTS_DIR, id);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  fs.writeFileSync(targetPath, content, 'utf8');
  return { id: path.relative(AGENTS_DIR, targetPath), name, category, content };
});

ipcMain.handle('agents-delete', async (event, id: string) => {
  const filePath = path.join(AGENTS_DIR, id);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('agents-get-directory', () => {
  return AGENTS_DIR;
});
