import { apiRequest, type ApiResponse } from './client';
import type { User, UserRole, PagedUsers, UserFilters, UserStats, UpdateUserData, UpdateProfileData } from '../types/users';

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
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta);

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

  // Obtener estadísticas de usuarios
  async obtenerEstadisticas(): Promise<UserStats> {
    const result = await apiRequest<UserStats>('/usuarios/stats', {
      method: 'GET',
    });
    // El backend devuelve UserStats directamente, no envuelto en ApiResponse
    return (result.data || result) as UserStats;
  },

  // Exportar usuarios a CSV
  async exportarUsuarios(filters?: UserFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.rol) params.append('rol', filters.rol);
    if (filters?.verificado !== undefined) params.append('verificado', filters.verificado.toString());
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString());
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta);

    // Usar la misma configuración de API que las otras funciones
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    const url = `${API_BASE_URL}/usuarios/export?${params.toString()}`;
    
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al exportar usuarios');
    }

    return response.blob();
  },

  // Actualizar usuario por admin
  async actualizarUsuario(id: number, data: UpdateUserData): Promise<ApiResponse<User>> {
    return apiRequest<User>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Reenviar verificación por admin
  async reenviarVerificacion(userId: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/usuarios/${userId}/resend-verification`, {
      method: 'POST',
    });
  },

  // Restablecer contraseña por admin
  async restablecerPassword(userId: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/usuarios/${userId}/reset-password`, {
      method: 'POST',
    });
  },

  // Listar analistas disponibles
  async listarAnalistas(): Promise<ApiResponse<User[]>> {
    return apiRequest<User[]>('/usuarios/analistas', {
      method: 'GET',
    });
  },

  // Obtener perfil propio
  async obtenerPerfilPropio(): Promise<ApiResponse<User>> {
    return apiRequest<User>('/usuarios/me', {
      method: 'GET',
    });
  },

  // Actualizar perfil propio
  async actualizarPerfilPropio(data: UpdateProfileData): Promise<ApiResponse<User>> {
    return apiRequest<User>('/usuarios/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
