import { apiRequest, type ApiResponse } from './client';
import type {
  Evento,
  EventoCreatePayload,
  EventoInscripto,
  EventoUpdatePayload,
} from '../types/eventos';

export const eventosApi = {
  // Listar eventos (filtrado por rol en el backend)
  async listar(): Promise<ApiResponse<Evento[]>> {
    return apiRequest<Evento[]>('/eventos', { method: 'GET' });
  },

  // Obtener un evento por ID
  async obtener(id: number): Promise<ApiResponse<Evento>> {
    return apiRequest<Evento>(`/eventos/${id}`, { method: 'GET' });
  },

  // Crear un evento
  async crear(data: EventoCreatePayload): Promise<ApiResponse<Evento>> {
    return apiRequest<Evento>('/eventos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Actualizar un evento
  async actualizar(id: number, data: EventoUpdatePayload): Promise<ApiResponse<Evento>> {
    return apiRequest<Evento>(`/eventos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Eliminar un evento (soft delete)
  async eliminar(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/eventos/${id}`, { method: 'DELETE' });
  },

  // Inscribirse a un evento
  async inscribirse(id: number): Promise<ApiResponse<Evento>> {
    return apiRequest<Evento>(`/eventos/${id}/inscripciones`, { method: 'POST' });
  },

  // Eventos en los que el usuario actual está inscrito
  async misInscripciones(): Promise<ApiResponse<Evento[]>> {
    return apiRequest<Evento[]>('/eventos/mias/inscripciones', { method: 'GET' });
  },

  // Listar inscriptos de un evento
  async inscriptos(id: number): Promise<ApiResponse<EventoInscripto[]>> {
    return apiRequest<EventoInscripto[]>(`/eventos/${id}/inscriptos`, { method: 'GET' });
  },
};
