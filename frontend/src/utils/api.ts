// frontend/src/utils/api.ts

export const getBaseUrl = () => {
  // Use relative URLs and let Vite proxy handle it during development,
  // or use relative URLs in production (same host).
  return '';
};

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

export interface Session {
  id: string;
  state: 'running' | 'stopped';
  // Add other session properties as needed
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  category?: string;
  content: string;
}

export const getPersonas = async (): Promise<Persona[]> => {
  const response = await fetch(`${getBaseUrl()}/api/personas`);
  if (!response.ok) {
    throw new Error(`Error fetching personas: ${response.statusText}`);
  }
  return response.json();
};

export const getSkills = async (): Promise<Skill[]> => {
  const response = await fetch(`${getBaseUrl()}/api/skills`);
  if (!response.ok) {
    throw new Error(`Error fetching skills: ${response.statusText}`);
  }
  return response.json();
};

export const createSession = async (
  name: string,
  cwd: string,
  command: string,
  personaId: string | null,
  selectedSkills: string[] = [],
  rows?: number,
  cols?: number,
): Promise<Session> => {
  const response = await fetch(`${getBaseUrl()}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, cwd, command, personaId, selectedSkills, rows, cols }),
  });
  if (!response.ok) {
    throw new Error(`Error creating session: ${response.statusText}`);
  }
  return response.json();
};

export const createSkill = async (skill: Omit<Skill, 'id'>): Promise<{ id: string }> => {
  const response = await fetch(`${getBaseUrl()}/api/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skill),
  });
  if (!response.ok) {
    throw new Error(`Error creating skill: ${response.statusText}`);
  }
  return response.json();
};

export const updateSkill = async (id: string, skill: Partial<Skill>): Promise<void> => {
  const response = await fetch(`${getBaseUrl()}/api/skills/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skill),
  });
  if (!response.ok) {
    throw new Error(`Error updating skill: ${response.statusText}`);
  }
};

// Placeholder for other API calls that might exist
export const createPersona = async (persona: Persona): Promise<Persona> => {
  const response = await fetch(`${getBaseUrl()}/api/personas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(persona),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error creating persona: ${response.statusText}`);
  }
  return response.json();
};

export const getSessions = async (): Promise<Session[]> => {
  const response = await fetch(`${getBaseUrl()}/api/sessions`);
  if (!response.ok) {
    throw new Error(`Error fetching sessions: ${response.statusText}`);
  }
  return response.json();
};

export const updatePersona = async (id: string, persona: Partial<Persona>): Promise<Persona> => {
  const response = await fetch(`${getBaseUrl()}/api/personas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(persona),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error updating persona: ${response.statusText}`);
  }
  return response.json();
};

export const deletePersona = async (id: string): Promise<void> => {
  const response = await fetch(`${getBaseUrl()}/api/personas/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error deleting persona: ${response.statusText}`);
  }
};

export const deleteSession = async (id: string): Promise<void> => {
  const response = await fetch(`${getBaseUrl()}/api/sessions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error deleting session: ${response.statusText}`);
  }
};
