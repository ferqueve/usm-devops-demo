import { apiRequest, type ApiResponse } from './client';
import type {
  Evento,
  EventoCreatePayload,
  EventoFeedbackResumen,
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

  // Cancelar la propia inscripción (auto-promueve la lista de espera)
  async cancelarInscripcion(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/eventos/${id}/inscripciones/mia`, { method: 'DELETE' });
  },

  // Resumen de feedback / satisfacción del evento
  async feedback(id: number): Promise<ApiResponse<EventoFeedbackResumen>> {
    return apiRequest<EventoFeedbackResumen>(`/eventos/${id}/feedback`, { method: 'GET' });
  },

  // Dejar / actualizar la valoración del usuario actual
  async dejarFeedback(id: number, data: { rating: number; comentario?: string }): Promise<ApiResponse<EventoFeedbackResumen>> {
    return apiRequest<EventoFeedbackResumen>(`/eventos/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Eventos en los que el usuario actual está inscrito
  async misInscripciones(): Promise<ApiResponse<Evento[]>> {
    return apiRequest<Evento[]>('/eventos/inscripciones/mias', { method: 'GET' });
  },

  // Listar inscriptos de un evento
  async inscriptos(id: number): Promise<ApiResponse<EventoInscripto[]>> {
    return apiRequest<EventoInscripto[]>(`/eventos/${id}/inscriptos`, { method: 'GET' });
  },

  // Notificar por email a los inscriptos
  async notificar(id: number, data: { asunto: string; mensaje: string }): Promise<ApiResponse<{ total: number; enviados: number }>> {
    return apiRequest<{ total: number; enviados: number }>(`/eventos/${id}/notificar`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Marcar/desmarcar asistencia de una inscripción (check-in)
  async marcarAsistencia(inscripcionId: number, asistio: boolean): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/eventos/inscripciones/${inscripcionId}/asistencia?asistio=${asistio}`, { method: 'PUT' });
  },
};
