import { apiRequest, type ApiResponse } from './client';
import type { Carrera } from '../types/spaces';

export const carrerasApi = {
  // Obtener todas las carreras
  async obtenerCarreras(): Promise<ApiResponse<Carrera[]>> {
    return apiRequest<Carrera[]>('/carreras', { method: 'GET' });
  },

  // Obtener una carrera por ID
  async obtenerCarrera(id: number): Promise<ApiResponse<Carrera>> {
    return apiRequest<Carrera>(`/carreras/${id}`, { method: 'GET' });
  },

  // Crear una nueva carrera
  async crearCarrera(data: {
    nombre: string;
    codigo?: string;
  }): Promise<ApiResponse<Carrera>> {
    return apiRequest<Carrera>('/carreras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Actualizar una carrera
  async actualizarCarrera(id: number, data: {
    nombre?: string;
    codigo?: string;
  }): Promise<ApiResponse<Carrera>> {
    return apiRequest<Carrera>(`/carreras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Eliminar una carrera (soft delete)
  async eliminarCarrera(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/carreras/${id}`, { method: 'DELETE' });
  },

  // Buscar carreras por nombre
  async buscarCarrerasPorNombre(nombre: string): Promise<ApiResponse<Carrera[]>> {
    return apiRequest<Carrera[]>(`/carreras/search?nombre=${encodeURIComponent(nombre)}`, { method: 'GET' });
  },
};

