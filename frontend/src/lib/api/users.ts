import { apiRequest, type ApiResponse } from './client';
import type { User, UserRole, PagedUsers, UserFilters } from '../types/users';

// API de usuarios
export const usuariosApi = {
  // Listar usuarios con paginación y filtros
  async listarUsuarios(
    page: number = 0,
    size: number = 10,
    filters?: UserFilters
  ): Promise<ApiResponse<PagedUsers>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (filters?.search) params.append('search', filters.search);
    if (filters?.rol) params.append('rol', filters.rol);
    if (filters?.verificado !== undefined) params.append('verificado', filters.verificado.toString());
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString());

    return apiRequest<PagedUsers>(`/usuarios?${params.toString()}`, {
      method: 'GET',
    });
  },

  // Cambiar rol de usuario
  async cambiarRol(userId: number, rol: UserRole): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/usuarios/${userId}/rol`, {
      method: 'PUT',
      body: JSON.stringify({ rolApp: rol }),
    });
  },

  // Activar/Desactivar usuario
  async toggleActivo(userId: number): Promise<ApiResponse<User>> {
    return apiRequest<User>(`/usuarios/${userId}/toggle-activo`, {
      method: 'PUT',
    });
  },
};
