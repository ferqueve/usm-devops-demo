import { apiRequest, clearApiCache, type ApiResponse } from './client';
import type {
  Racha,
  Tutoria,
  TutoriaAgendado,
  TutoriaCreateInput,
  TutoriaFeedbackResumen,
  TutoriaRecurso,
  TutoriaUpdateInput,
  TutorRanking,
} from '../types/tutorias';

export const tutoriasApi = {
  // Listar tutorías (opcionalmente filtrando por materia)
  async listar(materiaId?: number): Promise<ApiResponse<Tutoria[]>> {
    const query = materiaId != null ? `?materiaId=${materiaId}` : '';
    return apiRequest<Tutoria[]>(`/tutorias${query}`, { method: 'GET' });
  },

  // Detalle de una tutoría
  async obtener(id: number): Promise<ApiResponse<Tutoria>> {
    return apiRequest<Tutoria>(`/tutorias/${id}`, { method: 'GET' });
  },

  // Estudiantes agendados en una tutoría
  async agendados(id: number): Promise<ApiResponse<TutoriaAgendado[]>> {
    return apiRequest<TutoriaAgendado[]>(`/tutorias/${id}/agendados`, { method: 'GET' });
  },

  // Eliminar una tutoría (admin/analista o docente dueño)
  async eliminar(id: number): Promise<ApiResponse<void>> {
    const response = await apiRequest<void>(`/tutorias/${id}`, { method: 'DELETE' });
    clearApiCache();
    return response;
  },

  // Notificar por email a los agendados
  async notificar(id: number, data: { asunto: string; mensaje: string }): Promise<ApiResponse<{ total: number; enviados: number }>> {
    return apiRequest<{ total: number; enviados: number }>(`/tutorias/${id}/notificar`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Tutorías del usuario autenticado (docente: sus franjas / estudiante: las agendadas)
  async misTutorias(): Promise<ApiResponse<Tutoria[]>> {
    return apiRequest<Tutoria[]>('/tutorias/mias', { method: 'GET' });
  },

  // Crear una franja de tutoría (el docente es el usuario autenticado)
  async crear(data: TutoriaCreateInput): Promise<ApiResponse<Tutoria>> {
    const response = await apiRequest<Tutoria>('/tutorias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    clearApiCache();
    return response;
  },

  // Actualizar una franja de tutoría
  async actualizar(id: number, data: TutoriaUpdateInput): Promise<ApiResponse<Tutoria>> {
    const response = await apiRequest<Tutoria>(`/tutorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    clearApiCache();
    return response;
  },

  // Agendar una tutoría como estudiante (con temario opcional)
  async agendar(id: number, temario?: string): Promise<ApiResponse<Tutoria>> {
    const response = await apiRequest<Tutoria>(`/tutorias/${id}/agendar`, {
      method: 'POST',
      body: JSON.stringify({ temario: temario ?? null }),
    });
    clearApiCache();
    return response;
  },

  // Cancelar una reserva de tutoría
  async cancelarReserva(reservaId: number): Promise<ApiResponse<void>> {
    const response = await apiRequest<void>(`/tutorias/reservas/${reservaId}`, {
      method: 'DELETE',
    });
    clearApiCache();
    return response;
  },

  // Confirmar asistencia (anti no-show)
  async confirmarReserva(reservaId: number): Promise<ApiResponse<void>> {
    const r = await apiRequest<void>(`/tutorias/reservas/${reservaId}/confirmar`, { method: 'PUT' });
    clearApiCache();
    return r;
  },

  // Marcar/desmarcar asistencia (check-in) — docente
  async marcarAsistencia(reservaId: number, asistio: boolean): Promise<ApiResponse<void>> {
    const r = await apiRequest<void>(`/tutorias/reservas/${reservaId}/asistencia?asistio=${asistio}`, { method: 'PUT' });
    clearApiCache();
    return r;
  },

  // Activar/desactivar "disponible en vivo" (walk-in)
  async toggleEnVivo(id: number, activo: boolean): Promise<ApiResponse<Tutoria>> {
    const r = await apiRequest<Tutoria>(`/tutorias/${id}/en-vivo?activo=${activo}`, { method: 'PUT' });
    clearApiCache();
    return r;
  },

  // Feedback / satisfacción
  async feedback(id: number): Promise<ApiResponse<TutoriaFeedbackResumen>> {
    return apiRequest<TutoriaFeedbackResumen>(`/tutorias/${id}/feedback`, { method: 'GET' });
  },
  async dejarFeedback(id: number, data: { rating: number; comentario?: string }): Promise<ApiResponse<TutoriaFeedbackResumen>> {
    const r = await apiRequest<TutoriaFeedbackResumen>(`/tutorias/${id}/feedback`, { method: 'POST', body: JSON.stringify(data) });
    clearApiCache();
    return r;
  },

  // Ranking de tutores
  async ranking(): Promise<ApiResponse<TutorRanking[]>> {
    return apiRequest<TutorRanking[]>('/tutorias/ranking/tutores', { method: 'GET' });
  },

  // Racha / badges del estudiante
  async racha(): Promise<ApiResponse<Racha>> {
    return apiRequest<Racha>('/tutorias/mias/racha', { method: 'GET' });
  },

  // Recursos / material
  async recursos(id: number): Promise<ApiResponse<TutoriaRecurso[]>> {
    return apiRequest<TutoriaRecurso[]>(`/tutorias/${id}/recursos`, { method: 'GET' });
  },
  async agregarRecurso(id: number, data: { titulo: string; url: string }): Promise<ApiResponse<TutoriaRecurso>> {
    const r = await apiRequest<TutoriaRecurso>(`/tutorias/${id}/recursos`, { method: 'POST', body: JSON.stringify(data) });
    clearApiCache();
    return r;
  },
  async eliminarRecurso(recursoId: number): Promise<ApiResponse<void>> {
    const r = await apiRequest<void>(`/tutorias/recursos/${recursoId}`, { method: 'DELETE' });
    clearApiCache();
    return r;
  },

  // Temarios pedidos (para resumen IA) — docente
  async temarios(id: number): Promise<ApiResponse<string[]>> {
    return apiRequest<string[]>(`/tutorias/${id}/temarios`, { method: 'GET' });
  },
};
