import { apiRequest, type ApiResponse } from './client';
import type { Materia, Inscripcion } from '../types/materias';

export const materiasApi = {
  // Obtener todas las materias activas
  async obtenerMaterias(): Promise<ApiResponse<Materia[]>> {
    return apiRequest<Materia[]>('/materias', { method: 'GET' });
  },

  // Obtener las materias relacionadas al usuario autenticado
  // (docente: las que dicta; estudiante: las inscriptas)
  async obtenerMisMaterias(): Promise<ApiResponse<Materia[]>> {
    return apiRequest<Materia[]>('/materias/mias', { method: 'GET' });
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
  }): Promise<ApiResponse<Materia>> {
    return apiRequest<Materia>(`/materias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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
};
