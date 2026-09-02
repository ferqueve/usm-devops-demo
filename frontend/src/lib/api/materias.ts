import { apiRequest, type ApiResponse } from './client';
import type { Materia, Inscripcion, MapaCarrera } from '../types/materias';

export const materiasApi = {
  // Obtener todas las materias activas
  async obtenerMaterias(): Promise<ApiResponse<Materia[]>> {
    return apiRequest<Materia[]>('/materias', { method: 'GET' });
  },

  // Materias que dicta el usuario autenticado
  async obtenerMateriasQueDicto(): Promise<ApiResponse<Materia[]>> {
    return apiRequest<Materia[]>('/materias/dictadas', { method: 'GET' });
  },

  // Materias en las que el usuario autenticado está inscripto
  async obtenerMateriasQueCurso(): Promise<ApiResponse<Materia[]>> {
    return apiRequest<Materia[]>('/materias/cursando', { method: 'GET' });
  },

  // Obtener una materia por ID
  async obtenerMateria(id: number): Promise<ApiResponse<Materia>> {
    return apiRequest<Materia>(`/materias/${id}`, { method: 'GET' });
  },

  // Obtener materias de una carrera
  async obtenerMateriasPorCarrera(carreraId: number): Promise<ApiResponse<Materia[]>> {
    return apiRequest<Materia[]>(`/materias/por-carrera/${carreraId}`, { method: 'GET' });
  },

  // Crear una nueva materia
  async crearMateria(data: {
    nombre: string;
    codigo?: string;
    descripcion?: string;
    carreraId: number;
    docenteId?: number;
    semestre?: number;
    creditos?: number;
    prerrequisitoIds?: number[];
  }): Promise<ApiResponse<Materia>> {
    return apiRequest<Materia>('/materias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Actualizar una materia
  async actualizarMateria(id: number, data: {
    nombre?: string;
    codigo?: string;
    descripcion?: string;
    carreraId?: number;
    docenteId?: number;
    semestre?: number;
    creditos?: number;
    prerrequisitoIds?: number[];
  }): Promise<ApiResponse<Materia>> {
    return apiRequest<Materia>(`/materias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Mapa de correlativas de una carrera (con el avance del estudiante)
  async obtenerMapa(carreraId: number): Promise<ApiResponse<MapaCarrera>> {
    return apiRequest<MapaCarrera>(`/materias/mapa?carreraId=${carreraId}`, { method: 'GET' });
  },

  // (Docente/Admin) Cambiar estado de una inscripción: ACTIVA (cursando) / APROBADA (cursada)
  async cambiarEstadoInscripcion(
    inscripcionId: number,
    valor: 'ACTIVA' | 'APROBADA',
  ): Promise<ApiResponse<Inscripcion>> {
    return apiRequest<Inscripcion>(
      `/materias/inscripciones/${inscripcionId}/estado?valor=${valor}`,
      { method: 'PUT' },
    );
  },

  // Eliminar una materia (soft delete)
  async eliminarMateria(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/materias/${id}`, { method: 'DELETE' });
  },

  // Obtener inscriptos de una materia
  async obtenerInscriptos(materiaId: number): Promise<ApiResponse<Inscripcion[]>> {
    return apiRequest<Inscripcion[]>(`/materias/${materiaId}/inscriptos`, { method: 'GET' });
  },

  // Inscribirse a una materia (estudiante autenticado)
  async inscribirse(materiaId: number): Promise<ApiResponse<Inscripcion>> {
    return apiRequest<Inscripcion>(`/materias/${materiaId}/inscripciones`, {
      method: 'POST',
    });
  },

  // Obtener las inscripciones del usuario autenticado
  async misInscripciones(): Promise<ApiResponse<Inscripcion[]>> {
    return apiRequest<Inscripcion[]>('/materias/inscripciones/mias', { method: 'GET' });
  },

  // Cancelar una inscripción
  async cancelarInscripcion(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/materias/inscripciones/${id}`, { method: 'DELETE' });
  },

  // (Admin) Inscribir a un estudiante específico
  async inscribirEstudiante(materiaId: number, usuarioId: number): Promise<ApiResponse<Inscripcion>> {
    return apiRequest<Inscripcion>(`/materias/${materiaId}/inscripciones/admin`, {
      method: 'POST',
      body: JSON.stringify({ usuarioId }),
    });
  },

  // (Admin) Eliminar cualquier inscripción
  async eliminarInscripcionAdmin(inscripcionId: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/materias/inscripciones/${inscripcionId}/admin`, { method: 'DELETE' });
  },

  // Notificar por email a los inscriptos
  async notificarInscriptos(
    materiaId: number,
    data: { asunto: string; mensaje: string },
  ): Promise<ApiResponse<{ total: number; enviados: number }>> {
    return apiRequest<{ total: number; enviados: number }>(`/materias/${materiaId}/notificar`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
