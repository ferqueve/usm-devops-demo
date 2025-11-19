export type AuditLogAccion = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: number;
  entidad: string;
  entidadId: number;
  accion: AuditLogAccion;
  usuarioId: number | null;
  usuarioNombre: string | null;
  usuarioEmail: string | null;
  timestamp: string;
  datosPrevios: string | null;
  datosNuevos: string | null;
}

export interface AuditLogFilters {
  entidad?: string;
  usuarioId?: number;
  accion?: AuditLogAccion;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
}

export interface PagedAuditLogResponse {
  content: AuditLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  numberOfElements: number;
}

