import { http } from '@/services/httpClient';
import type { AuthUser, LoginResponse } from './types';

/** POST /auth/login — returns token + basic user; token is stored by the caller. */
export function login(username: string, password: string): Promise<LoginResponse> {
  return http.post<LoginResponse>('/auth/login', { username, password });
}

/** GET /auth/me — authoritative current-user record (incl. classIds). */
export function fetchMe(): Promise<AuthUser> {
  return http.get<AuthUser>('/auth/me');
}
