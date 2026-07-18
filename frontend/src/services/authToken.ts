/**
 * Single source of truth for the JWT access token. Kept out of React state so
 * the plain `httpClient` (below) can read it without importing React context,
 * and so it survives reloads.
 */
const STORAGE_KEY = 'gary.access_token';

let inMemoryToken: string | null = null;

export function getToken(): string | null {
  if (inMemoryToken !== null) return inMemoryToken;
  try {
    inMemoryToken = localStorage.getItem(STORAGE_KEY);
  } catch {
    inMemoryToken = null;
  }
  return inMemoryToken;
}

export function setToken(token: string): void {
  inMemoryToken = token;
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* storage unavailable — in-memory token still works for the session */
  }
}

export function clearToken(): void {
  inMemoryToken = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
