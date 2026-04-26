import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export interface BriefOptions {
  persona?: string;
  libraryPath: string;
}

export function synthesizeBrief(options: BriefOptions): string {
  const { persona, libraryPath } = options;
  
  return `
# Overseer Hub: Session Briefing
Generated: ${new Date().toISOString()}

## Identity & Voice
${persona || 'You are an efficient AI Assistant running inside the Overseer Hub.'}

## Ecosystem Integration
- **Shared Skill Library:** \`${libraryPath}\`
- **Global Agents Directory:** \`${path.join(libraryPath, '../agents')}\`

## Instructions
1. You are running inside the **Overseer Native Command Center**.
2. You have access to a shared library of technical skills and agent roles. 
3. When asked to perform a specialized task, check \`${libraryPath}\` for existing .md or .py skills that can help.
4. If you create a new reusable workflow or "skill", save it as a Markdown file in the library to make it available to all future sessions.
5. Use the \`<voice>\` tag to speak to the user through the Mascot UI. Everything outside these tags should be pure terminal output or technical thought.

Example: \`<voice>I have analyzed the repository and am ready to begin.</voice>\`
`.trim();
}

export function getOrCreateBrief(sessionId: string, options: BriefOptions): string {
  const briefDir = path.join(app.getPath('userData'), 'briefs');
  if (!fs.existsSync(briefDir)) fs.mkdirSync(briefDir, { recursive: true });
  
  const briefPath = path.join(briefDir, `${sessionId}.md`);
  const content = synthesizeBrief(options);
  fs.writeFileSync(briefPath, content);
  
  return briefPath;
}
