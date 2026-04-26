
export interface AvatarConfig {
  eyes: string;
  mouth: string;
  hair: string;
  skinColor: string;
  hairColor: string;
  backgroundColor: string;
  clothingColor: string;
  clothing: string;
  glasses: string;
  beard: string;
  hat: string;
  accessories: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  eyes: 'variant01',
  mouth: 'happy04',
  hair: 'short01',
  skinColor: 'fcd5b0',
  hairColor: '6b3a2a',
  backgroundColor: '1e293b',
  clothingColor: '5bc0de',
  clothing: 'variant01',
  glasses: '',
  beard: '',
  hat: '',
  accessories: '',
};

export interface Persona {
  id: string;
  name: string;
  title: string;
  instructions: string;
  avatarConfig: AvatarConfig;
}

export type CliType = 'claude' | 'gemini' | 'cursor-agent';
export type CursorMode = 'agent' | 'plan' | 'ask';

export interface SessionMetadata {
  id: string;
  name: string;
  cwd: string;
  persona?: string;
  lastUsed: number;
  isArchived: boolean;
  cliType: CliType;
  agentSessionId?: string;
  yoloMode?: boolean;
  allowedTools?: string;
  cursorMode?: CursorMode;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  content: string;
}

export interface Repository {
  id: string;
  name: string;
  path: string;
}
