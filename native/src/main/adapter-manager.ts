import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const OVERSEER_BIN_DIR = path.join(os.homedir(), '.overseer', 'bin');

if (!fs.existsSync(OVERSEER_BIN_DIR)) {
  fs.mkdirSync(OVERSEER_BIN_DIR, { recursive: true });
}

function getRealPath(cmd: string): string | null {
  try {
    return execSync(`which ${cmd}`).toString().trim();
  } catch (e) {
    return null;
  }
}

export function setupAdapters() {
  const claudePath = getRealPath('claude');
  if (claudePath && !claudePath.startsWith(OVERSEER_BIN_DIR)) {
    const wrapper = `#!/bin/bash
if [ -n "$OVERSEER_BRIEF" ]; then
  exec ${claudePath} --system-prompt-file "$OVERSEER_BRIEF" "$@"
else
  exec ${claudePath} "$@"
fi
`;
    fs.writeFileSync(path.join(OVERSEER_BIN_DIR, 'claude'), wrapper, { mode: 0o755 });
  }

  const geminiPath = getRealPath('gemini');
  if (geminiPath && !geminiPath.startsWith(OVERSEER_BIN_DIR)) {
    const wrapper = `#!/bin/bash
if [ -n "$OVERSEER_BRIEF" ]; then
  # Gemini CLI already respects GEMINI_SYSTEM_MD, 
  # but we can force it here just in case or add extra flags.
  export GEMINI_SYSTEM_MD="$OVERSEER_BRIEF"
  exec ${geminiPath} "$@"
else
  exec ${geminiPath} "$@"
fi
`;
    fs.writeFileSync(path.join(OVERSEER_BIN_DIR, 'gemini'), wrapper, { mode: 0o755 });
  }
}

export function getOverseerBinDir(): string {
  return OVERSEER_BIN_DIR;
}
