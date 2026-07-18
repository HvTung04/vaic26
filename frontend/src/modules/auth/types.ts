export type UserRole = 'student' | 'teacher';

/** Shape of `GET /auth/me` after camelCase conversion. */
export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  classIds: string[];
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    fullName: string;
    role: UserRole;
  };
}
