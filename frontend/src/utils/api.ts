// frontend/src/utils/api.ts

export const getBaseUrl = () => {
  // Use relative URLs and let Vite proxy handle it during development,
  // or use relative URLs in production (same host).
  return '';
};

export interface Persona {
  id: string;
  name: string;
  instructions: string;
  avatarId: string; // Assuming an avatar ID is a string for now
}

export interface Session {
  id: string;
  state: 'running' | 'stopped';
  // Add other session properties as needed
}

export const getPersonas = async (): Promise<Persona[]> => {
  const response = await fetch(`${getBaseUrl()}/api/personas`);
  if (!response.ok) {
    throw new Error(`Error fetching personas: ${response.statusText}`);
  }
  return response.json();
};

export const createSession = async (
  name: string,
  cwd: string,
  command: string,
  personaId: string | null,
  rows?: number,
  cols?: number,
): Promise<Session> => {
  const response = await fetch(`${getBaseUrl()}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, cwd, command, personaId, rows, cols }),
  });
  if (!response.ok) {
    throw new Error(`Error creating session: ${response.statusText}`);
  }
  return response.json();
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
