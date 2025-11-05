import { apiRequest, type ApiResponse } from './client';
import type { Reserva, ReservaStats } from '../types/spaces';

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

export const reservationsApi = {
  // Crear nueva reserva
  async crearReserva(data: {
    espacioId: number;
    inicio: string; // ISO datetime
    fin: string;
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
    fechaInicio?: Date | null,
    fechaFin?: Date | null,
    tiempo?: string
  ): Promise<ApiResponse<PagedResponse<Reserva>>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (estado && estado !== 'todas') params.append('estado', estado);
    if (espacioId !== null && espacioId !== undefined) params.append('espacioId', espacioId.toString());
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

  // Obtener estadísticas personales de reservas
  async obtenerEstadisticasPersonales(): Promise<ApiResponse<ReservaStats>> {
    return apiRequest<ReservaStats>('/reservas/mis-reservas/stats', { method: 'GET' });
  },
};
