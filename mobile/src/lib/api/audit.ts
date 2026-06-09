import { http } from '../http';
import type { AuditLog, AuditLogAccion, Page } from '../types';

export type AuditFilters = {
  entidad?: string;
  accion?: AuditLogAccion;
  usuarioId?: number;
  desde?: string;
  hasta?: string;
};

function toQuery(params: Record<string, unknown>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

/** GET /audit — log de auditoría paginado. */
export function listarLogsAuditoria(
  page = 0,
  size = 20,
  filters: AuditFilters = {},
): Promise<Page<AuditLog>> {
  return http.get<Page<AuditLog>>(`/audit${toQuery({ page, size, ...filters })}`);
}
