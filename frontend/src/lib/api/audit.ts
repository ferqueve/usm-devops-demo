import { apiRequest } from './client';
import type { AuditLog, AuditLogFilters, PagedAuditLogResponse } from '../types/audit';

export const auditApi = {
  /**
   * Listar logs de auditoría con filtros y paginación
   */
  listarLogsAuditoria: async (
    filters: AuditLogFilters = {},
    page: number = 0,
    size: number = 20
  ): Promise<PagedAuditLogResponse> => {
    const params = new URLSearchParams();
    
    if (filters.entidad) params.append('entidad', filters.entidad);
    if (filters.usuarioId) params.append('usuarioId', filters.usuarioId.toString());
    if (filters.accion) params.append('accion', filters.accion);
    if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
    if (filters.search) params.append('search', filters.search);
    
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    const response = await apiRequest<PagedAuditLogResponse>(
      `/audit?${params.toString()}`,
      { method: 'GET' }
    );
    
    if (!response.data) {
      throw new Error('No se recibieron datos de la API');
    }
    
    return response.data;
  },

  /**
   * Obtener un log de auditoría por ID
   */
  obtenerLogAuditoria: async (id: number): Promise<AuditLog> => {
    const response = await apiRequest<AuditLog>(
      `/audit/${id}`,
      { method: 'GET' }
    );
    
    if (!response.data) {
      throw new Error('No se recibieron datos de la API');
    }
    
    return response.data;
  },
};

