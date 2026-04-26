import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';

const SKILLS_DIR = path.join(os.homedir(), '.overseer', 'skills');

if (!fs.existsSync(SKILLS_DIR)) {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  content: string;
}

function getSkillFiles(dir: string, baseDir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getSkillFiles(file, baseDir));
    } else {
      if (file.endsWith('.md')) {
        results.push(path.relative(baseDir, file));
      }
    }
  });
  return results;
}

ipcMain.handle('skills-get-all', async () => {
  const files = getSkillFiles(SKILLS_DIR, SKILLS_DIR);
  const skills: Skill[] = files.map((file) => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf8');
    const name = path.basename(file, '.md');
    const category = path.dirname(file) === '.' ? '' : path.dirname(file);
    
    // Basic parsing of metadata if available (e.g. description)
    // For now we'll just return the name and category
    return {
      id: file,
      name,
      category,
      description: '', // We could parse this from the content if we want
      content,
    };
  });
  return skills;
});

ipcMain.handle('skills-save', async (event, skill: Omit<Skill, 'id'> & { id?: string }) => {
  const { id, name, category, content } = skill;
  const fileName = `${name}.md`;
  const targetDir = category ? path.join(SKILLS_DIR, category) : SKILLS_DIR;
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, fileName);
  
  // If id is provided and different from new path, delete old file (rename)
  if (id && id !== path.relative(SKILLS_DIR, targetPath)) {
    const oldPath = path.join(SKILLS_DIR, id);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  fs.writeFileSync(targetPath, content, 'utf8');
  return { id: path.relative(SKILLS_DIR, targetPath), name, category, content };
});

ipcMain.handle('skills-delete', async (event, id: string) => {
  const filePath = path.join(SKILLS_DIR, id);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('skills-get-directory', () => {
  return SKILLS_DIR;
});
