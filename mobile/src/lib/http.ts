/**
 * Cliente HTTP base. Espeja `frontend/src/lib/api/client.ts`:
 * - Inyecta `Authorization: Bearer <token>` desde AsyncStorage.
 * - Desempaqueta el envelope `{ success, message, data, error }`.
 * - Ante 401 / token expirado intenta refrescar una vez; si falla, dispara logout.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import type { ApiResponse } from './types';

export const STORAGE_KEYS = {
  token: 'auth_token',
  refreshToken: 'auth_refresh_token',
  user: 'auth_user',
} as const;

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.token);
}

export async function setSession(token: string, refreshToken: string): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.token, token],
    [STORAGE_KEYS.refreshToken, refreshToken],
  ]);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.token,
    STORAGE_KEYS.refreshToken,
    STORAGE_KEYS.user,
  ]);
}

/** El AuthContext registra acá su handler para cerrar sesión ante un 401 irrecuperable. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function looksLikeJwtError(status: number, message?: string): boolean {
  if (status === 401) return true;
  const m = (message ?? '').toLowerCase();
  return status === 500 && (m.includes('jwt') || m.includes('token') || m.includes('expired'));
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refreshToken);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Refresh-Token': refreshToken },
    });
    if (!res.ok) return false;
    const body = (await res.json()) as ApiResponse<{ token: string; refreshToken: string }>;
    if (!body.success || !body.data?.token) return false;
    await setSession(body.data.token, body.data.refreshToken ?? refreshToken);
    return true;
  } catch {
    return false;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

async function rawRequest<T>(
  path: string,
  options: RequestOptions,
  isRetry = false,
  unwrap = true,
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: hasBody
      ? options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });

  // Sin contenido
  if (res.status === 204) return undefined as T;

  let body: ApiResponse<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text) as ApiResponse<T>;
    } catch {
      body = null;
    }
  }

  if (!res.ok || (body && body.success === false)) {
    const message = body?.error || body?.message || `HTTP ${res.status}`;
    if (!isRetry && looksLikeJwtError(res.status, message)) {
      const refreshed = await tryRefresh();
      if (refreshed) return rawRequest<T>(path, options, true, unwrap);
      await clearSession();
      onUnauthorized?.();
    }
    throw new ApiError(message, res.status);
  }

  // Algunos endpoints (ej. /usuarios) no usan el envelope y devuelven el cuerpo directo.
  if (!unwrap) return body as unknown as T;
  return (body ? body.data : (undefined as T)) as T;
}

/** Raíz del host (sin /api/v1), para endpoints de actuator y OAuth. */
export const API_HOST = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
const HOST_ROOT = API_HOST;

/** GET a una ruta absoluta del host (ej. /actuator/health), devolviendo JSON crudo. */
async function hostGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${HOST_ROOT}${path}`, { headers });
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status);
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: 'GET' }),
  /** GET sin desempaquetar el envelope (para endpoints que devuelven el cuerpo directo). */
  getRaw: <T>(path: string, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: 'GET' }, false, false),
  /** GET a /actuator u otras rutas fuera de /api/v1. */
  hostGet,
  post: <T>(path: string, bodyData?: unknown, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: 'POST', body: bodyData }),
  put: <T>(path: string, bodyData?: unknown, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: 'PUT', body: bodyData }),
  patch: <T>(path: string, bodyData?: unknown, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: 'PATCH', body: bodyData }),
  delete: <T>(path: string, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: 'DELETE' }),
};
