import { apiRequest, clearApiCache, type ApiResponse } from './client';
import type { Tutoria, TutoriaCreateInput, TutoriaUpdateInput } from '../types/tutorias';

export const tutoriasApi = {
  // Listar tutorías (opcionalmente filtrando por materia)
  async listar(materiaId?: number): Promise<ApiResponse<Tutoria[]>> {
    const query = materiaId != null ? `?materiaId=${materiaId}` : '';
    return apiRequest<Tutoria[]>(`/tutorias${query}`, { method: 'GET' });
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

  // Agendar una tutoría como estudiante
  async agendar(id: number): Promise<ApiResponse<Tutoria>> {
    const response = await apiRequest<Tutoria>(`/tutorias/${id}/agendar`, {
      method: 'POST',
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
};
