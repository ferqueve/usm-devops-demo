import { apiRequest, type ApiResponse } from './client';
import type { Reserva } from '../types/spaces';

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
};

