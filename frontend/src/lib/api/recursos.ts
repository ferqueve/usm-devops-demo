import { apiRequest, type ApiResponse } from './client';
import type { Recurso } from '../types/recursos';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const recursosApi = {
  // Listar recursos de una materia
  async listarRecursos(materiaId: number): Promise<ApiResponse<Recurso[]>> {
    return apiRequest<Recurso[]>(`/materias/${materiaId}/recursos`, { method: 'GET' });
  },

  // Subir un recurso de tipo ARCHIVO (multipart)
  // Se usa fetch directo (no apiRequest JSON) para no setear Content-Type:
  // el navegador agrega el boundary correcto del FormData automáticamente.
  async subirArchivo(
    materiaId: number,
    formData: FormData
  ): Promise<ApiResponse<Recurso>> {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/materias/${materiaId}/recursos/archivo`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // No establecer Content-Type: el navegador lo hace con el boundary correcto
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Error al subir el recurso' }));
      throw new Error(errorData.error || errorData.message || 'Error al subir el recurso');
    }

    return (await response.json()) as ApiResponse<Recurso>;
  },

  // Crear un recurso de tipo ENLACE
  async crearEnlace(
    materiaId: number,
    data: { titulo: string; url: string; descripcion?: string }
  ): Promise<ApiResponse<Recurso>> {
    return apiRequest<Recurso>(`/materias/${materiaId}/recursos/enlace`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Eliminar un recurso (soft delete)
  async eliminarRecurso(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/recursos/${id}`, { method: 'DELETE' });
  },
};
