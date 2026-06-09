import { http, setSession } from '../http';
import type { AuthResponse } from '../types';

/** POST /auth/login — devuelve token + datos de usuario y persiste la sesión. */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await http.post<AuthResponse>('/auth/login', { email, password });
  await setSession(data.token, data.refreshToken);
  return data;
}

/** POST /auth/logout — best-effort en el backend; la limpieza local la hace AuthContext. */
export async function logout(): Promise<void> {
  try {
    await http.post<void>('/auth/logout');
  } catch {
    // ignorar errores de red en logout
  }
}

export type RegisterInput = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/** POST /auth/register */
export function register(data: RegisterInput): Promise<unknown> {
  return http.post<unknown>('/auth/register', data);
}

/** POST /auth/forgot-password */
export function forgotPassword(email: string): Promise<unknown> {
  return http.post<unknown>('/auth/forgot-password', { email });
}

/** GET /auth/verify — valida el token actual contra el backend. */
export async function verifyToken(): Promise<boolean> {
  try {
    await http.get<unknown>('/auth/verify');
    return true;
  } catch {
    return false;
  }
}
