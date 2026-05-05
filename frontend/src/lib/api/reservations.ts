import { apiRequest, type ApiResponse } from './client';
import type {
  Reserva,
  ReservaStats,
  ReservaItemSolicitado,
  ReservaItemSolicitadoEstado,
} from '../types/spaces';

export interface PagedResponse<T> {
  content: T[];
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

export interface InventoryRequestsQuery {
  page?: number;
  size?: number;
  estados?: ReservaItemSolicitadoEstado[];
  espacioId?: number;
  fechaDesde?: Date | string | null;
  fechaHasta?: Date | string | null;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface InventoryRequestUpdatePayload {
  estado?: ReservaItemSolicitadoEstado;
  inventarioItemId?: number | null;
  observaciones?: string | null;
}

export const reservationsApi = {
  // Crear nueva reserva
  async crearReserva(data: {
    espacioId: number;
    carreraId?: number; // Opcional
    inicio: string; // ISO datetime
    fin: string;
    titulo: string; // Obligatorio
    motivoSolicitud?: string; // Opcional
    tipoRecurrencia?: 'DIARIA' | 'SEMANAL' | 'MENSUAL'; // Opcional
    fechaFinRecurrencia?: string; // ISO datetime, requerido si tipoRecurrencia está presente
    analistaId?: number; // Opcional: ID del analista asignado (requerido para docentes)
    esPublica?: boolean; // Opcional: marcar reserva como pública (para usuarios internos)
    itemsSolicitados?: Array<{
      tipoElementoId: number;
      inventarioItemId?: number;
      cantidadSolicitada: number;
      observaciones?: string;
    }>;
  }): Promise<ApiResponse<Reserva>> {
    return apiRequest<Reserva>('/reservas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Obtener mis reservas
  async obtenerMisReservas(): Promise<ApiResponse<Reserva[]>> {
    return apiRequest<Reserva[]>('/reservas/mis-reservas', { method: 'GET' });
  },

  // Obtener mis reservas con paginación y filtros
  async obtenerMisReservasPaged(
    page: number = 0,
    size: number = 10,
    estado?: string,
    espacioId?: number | null,
    carreraId?: number | null,
    tipoEspacioId?: number | null,
    fechaInicio?: Date | null,
    fechaFin?: Date | null,
    tiempo?: string
  ): Promise<ApiResponse<PagedResponse<Reserva>>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (estado && estado !== 'todas') params.append('estado', estado);
    if (espacioId !== null && espacioId !== undefined) params.append('espacioId', espacioId.toString());
    if (carreraId !== null && carreraId !== undefined) params.append('carreraId', carreraId.toString());
    if (tipoEspacioId !== null && tipoEspacioId !== undefined) params.append('tipoEspacioId', tipoEspacioId.toString());
    if (fechaInicio) params.append('fechaInicio', fechaInicio.toISOString());
    if (fechaFin) params.append('fechaFin', fechaFin.toISOString());
    if (tiempo && tiempo !== 'todas') params.append('tiempo', tiempo);
    
    return apiRequest<PagedResponse<Reserva>>(`/reservas/mis-reservas/paged?${params.toString()}`, { method: 'GET' });
  },

  // Obtener una reserva por ID
  async obtenerReserva(id: number): Promise<ApiResponse<Reserva>> {
    return apiRequest<Reserva>(`/reservas/${id}`, { method: 'GET' });
  },

  // Actualizar una reserva
  async actualizarReserva(
    id: number,
    data: {
      inicio?: string;
      fin?: string;
      estado?: 'PENDIENTE' | 'APROBADO' | 'CANCELADO';
    }
  ): Promise<ApiResponse<Reserva>> {
    return apiRequest<Reserva>(`/reservas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Cancelar una reserva
  async cancelarReserva(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/reservas/${id}`, { method: 'DELETE' });
  },

  // Obtener reservas por espacio
  async obtenerReservasPorEspacio(espacioId: number): Promise<ApiResponse<Reserva[]>> {
    return apiRequest<Reserva[]>(`/reservas/espacio/${espacioId}`, { method: 'GET' });
  },

  // Obtener todas las reservas del sistema (público, para visualización)
  async obtenerTodasLasReservas(
    estado?: string,
    espacioId?: number | null,
    carreraId?: number | null,
    tipoEspacioId?: number | null,
    fechaInicio?: Date | null,
    fechaFin?: Date | null
  ): Promise<ApiResponse<Reserva[]>> {
    const params = new URLSearchParams();
    if (estado && estado !== 'todas') params.append('estado', estado);
    if (espacioId !== null && espacioId !== undefined) params.append('espacioId', espacioId.toString());
    if (carreraId !== null && carreraId !== undefined) params.append('carreraId', carreraId.toString());
    if (tipoEspacioId !== null && tipoEspacioId !== undefined) params.append('tipoEspacioId', tipoEspacioId.toString());
    if (fechaInicio) params.append('fechaInicio', fechaInicio.toISOString());
    if (fechaFin) params.append('fechaFin', fechaFin.toISOString());
    
    const queryString = params.toString();
    const url = queryString ? `/reservas/todas?${queryString}` : '/reservas/todas';
    return apiRequest<Reserva[]>(url, { method: 'GET' });
  },

  // Obtener todas las reservas del sistema con paginación (para ANALISTA/ADMIN)
  async obtenerTodasReservasPaged(
    page: number = 0,
    size: number = 10,
    estado?: string,
    espacioId?: number | null,
    carreraId?: number | null,
    tipoEspacioId?: number | null,
    usuarioId?: number | null,
    fechaInicio?: Date | null,
    fechaFin?: Date | null,
    tiempo?: string
  ): Promise<ApiResponse<PagedResponse<Reserva>>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (estado && estado !== 'todas') params.append('estado', estado);
    if (espacioId !== null && espacioId !== undefined) params.append('espacioId', espacioId.toString());
    if (carreraId !== null && carreraId !== undefined) params.append('carreraId', carreraId.toString());
    if (tipoEspacioId !== null && tipoEspacioId !== undefined) params.append('tipoEspacioId', tipoEspacioId.toString());
    if (usuarioId !== null && usuarioId !== undefined) params.append('usuarioId', usuarioId.toString());
    if (fechaInicio) params.append('fechaInicio', fechaInicio.toISOString());
    if (fechaFin) params.append('fechaFin', fechaFin.toISOString());
    if (tiempo && tiempo !== 'todas') params.append('tiempo', tiempo);
    
    return apiRequest<PagedResponse<Reserva>>(`/reservas/paged?${params.toString()}`, { method: 'GET' });
  },

  // Aprobar una reserva pendiente
  async aprobarReserva(id: number): Promise<ApiResponse<Reserva>> {
    return apiRequest<Reserva>(`/reservas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'APROBADO' }),
    });
  },

  // Rechazar una reserva pendiente
  async rechazarReserva(id: number, mensajeAnalista?: string): Promise<ApiResponse<Reserva>> {
    const body: { estado: string; mensajeAnalista?: string } = { estado: 'CANCELADO' };
    if (mensajeAnalista?.trim()) {
      body.mensajeAnalista = mensajeAnalista.trim();
    }
    return apiRequest<Reserva>(`/reservas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // Cambiar el estado de una reserva (método genérico)
  async cambiarEstadoReserva(
    id: number,
    estado: 'APROBADO' | 'CANCELADO',
    mensajeAnalista?: string
  ): Promise<ApiResponse<Reserva>> {
    const body: { estado: string; mensajeAnalista?: string } = { estado };
    if (mensajeAnalista?.trim()) {
      body.mensajeAnalista = mensajeAnalista.trim();
    }
    return apiRequest<Reserva>(`/reservas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // Obtener estadísticas personales de reservas
  async obtenerEstadisticasPersonales(): Promise<ApiResponse<ReservaStats>> {
    return apiRequest<ReservaStats>('/reservas/mis-reservas/stats', { method: 'GET' });
  },

  // Listar solicitudes de inventario asociadas a reservas
  async listarSolicitudesInventario(params: InventoryRequestsQuery = {}): Promise<ApiResponse<PagedResponse<ReservaItemSolicitado>>> {
    const searchParams = new URLSearchParams();
    const page = params.page ?? 0;
    const size = params.size ?? 20;

    searchParams.append('page', page.toString());
    searchParams.append('size', size.toString());

    if (params.estados && params.estados.length > 0) {
      params.estados.forEach((estado) => {
        searchParams.append('estado', estado);
      });
    }

    if (params.espacioId !== undefined && params.espacioId !== null) {
      searchParams.append('espacioId', params.espacioId.toString());
    }

    const toIso = (value?: Date | string | null) => {
      if (!value) return undefined;
      if (value instanceof Date) {
        return value.toISOString();
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? value.toString() : parsed.toISOString();
    };

    const fechaDesdeIso = toIso(params.fechaDesde);
    if (fechaDesdeIso) {
      searchParams.append('fechaDesde', fechaDesdeIso);
    }

    const fechaHastaIso = toIso(params.fechaHasta);
    if (fechaHastaIso) {
      searchParams.append('fechaHasta', fechaHastaIso);
    }

    if (params.search && params.search.trim().length > 0) {
      searchParams.append('search', params.search.trim());
    }

    if (params.sortField) {
      const direction = (params.sortDirection ?? 'desc').toLowerCase();
      searchParams.append('sort', `${params.sortField},${direction}`);
    }

    return apiRequest<PagedResponse<ReservaItemSolicitado>>(
      `/reservas/items-solicitados?${searchParams.toString()}`,
      { method: 'GET' }
    );
  },

  // Actualizar una solicitud de inventario (estado, asignaciones, observaciones)
  async actualizarSolicitudInventario(
    id: number,
    data: InventoryRequestUpdatePayload
  ): Promise<ApiResponse<ReservaItemSolicitado>> {
    const payload: Record<string, unknown> = {};

    if (data.estado) {
      payload.estado = data.estado;
    }

    if (data.inventarioItemId !== undefined) {
      payload.inventarioItemId = data.inventarioItemId;
    }

    if (data.observaciones !== undefined) {
      payload.observaciones = data.observaciones;
    }

    return apiRequest<ReservaItemSolicitado>(`/reservas/items-solicitados/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
