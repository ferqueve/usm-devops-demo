import { http } from '../http';
import type { Page, Usuario, UserRole, UserStats } from '../types';

/** Forma cruda de la página que devuelve /usuarios (sin envelope, usa pageNumber/pageSize). */
type RawUserPage = {
  content: Usuario[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type UsuarioFilters = {
  rolApp?: UserRole;
  activo?: boolean;
  search?: string;
};

function toQuery(params: Record<string, unknown>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

/** GET /usuarios — NO usa envelope; mapeamos la página cruda a nuestro shape. */
export async function listarUsuarios(
  page = 0,
  size = 20,
  filters: UsuarioFilters = {},
): Promise<Page<Usuario>> {
  const raw = await http.getRaw<RawUserPage>(`/usuarios${toQuery({ page, size, ...filters })}`);
  return {
    content: raw.content,
    page: raw.pageNumber,
    size: raw.pageSize,
    totalElements: raw.totalElements,
    totalPages: raw.totalPages,
    first: raw.first,
    last: raw.last,
  };
}

/** GET /usuarios/stats — también sin envelope. */
export function obtenerEstadisticasUsuarios(): Promise<UserStats> {
  return http.getRaw<UserStats>('/usuarios/stats');
}

/** PUT /usuarios/{id}/toggle-activo */
export function toggleActivo(userId: number): Promise<Usuario> {
  return http.put<Usuario>(`/usuarios/${userId}/toggle-activo`);
}

/** PUT /usuarios/{id}/rol */
export function cambiarRol(userId: number, rol: UserRole): Promise<unknown> {
  return http.put<unknown>(`/usuarios/${userId}/rol`, { rolApp: rol });
}
