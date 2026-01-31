import { apiRequest, type ApiResponse } from './client';
import type { 
  Espacio, 
  TipoEspacio, 
  EspacioFilters,
  PagedEspacios,
  Edificio
} from '../types/spaces';

export const espaciosApi = {
  // Espacios con paginación
  async listarEspacios(
    page: number = 0,
    size: number = 12,
    filters?: EspacioFilters
  ): Promise<ApiResponse<PagedEspacios>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipoEspacioId) params.append('tipoEspacioId', filters.tipoEspacioId.toString());
    if (filters?.edificioId) params.append('edificioId', filters.edificioId.toString());
    if (filters?.capacidadMin) params.append('capacidadMin', filters.capacidadMin.toString());
    if (filters?.capacidadMax) params.append('capacidadMax', filters.capacidadMax.toString());
    if (filters?.estado) params.append('estado', filters.estado);
    
    // Filtros de inventario múltiples
    if (filters?.filtrosInventario && filters.filtrosInventario.length > 0) {
      for (const filtro of filters.filtrosInventario) {
        params.append('tipoElementoIds', filtro.tipoElementoId.toString());
        if (filtro.cantidadMin !== undefined) {
          params.append('cantidadMins', filtro.cantidadMin.toString());
        }
        if (filtro.cantidadMax !== undefined) {
          params.append('cantidadMaxs', filtro.cantidadMax.toString());
        }
      }
    }
    
    return apiRequest<PagedEspacios>(`/espacios/paged?${params.toString()}`, { method: 'GET' });
  },
  
  // Filtros sin paginación (para usar cuando hay filtros activos)
  async filtrarEspacios(filters?: EspacioFilters): Promise<ApiResponse<Espacio[]>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipoEspacioId) params.append('tipoEspacioId', filters.tipoEspacioId.toString());
    if (filters?.edificioId) params.append('edificioId', filters.edificioId.toString());
    if (filters?.capacidadMin) params.append('capacidadMin', filters.capacidadMin.toString());
    if (filters?.capacidadMax) params.append('capacidadMax', filters.capacidadMax.toString());
    if (filters?.estado) params.append('estado', filters.estado);
    
    // Filtros de inventario múltiples
    if (filters?.filtrosInventario && filters.filtrosInventario.length > 0) {
      for (const filtro of filters.filtrosInventario) {
        params.append('tipoElementoIds', filtro.tipoElementoId.toString());
        if (filtro.cantidadMin !== undefined) {
          params.append('cantidadMins', filtro.cantidadMin.toString());
        }
        if (filtro.cantidadMax !== undefined) {
          params.append('cantidadMaxs', filtro.cantidadMax.toString());
        }
      }
    }
    
    return apiRequest<Espacio[]>(`/espacios/filter?${params.toString()}`, { method: 'GET' });
  },
  
  async obtenerEspacio(id: number): Promise<ApiResponse<Espacio>> {
    return apiRequest<Espacio>(`/espacios/${id}`, { method: 'GET' });
  },
  
  async crearEspacio(data: {
    nombre: string;
    capacidad: number;
    tipoEspacioId: number;
    imagenUrl?: string;
    color?: string;
    estado?: string;
  }): Promise<ApiResponse<Espacio>> {
    return apiRequest<Espacio>('/espacios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async actualizarEspacio(id: number, data: {
    nombre: string;
    capacidad: number;
    tipoEspacioId: number;
    imagenUrl?: string;
    color?: string;
    estado?: string;
  }): Promise<ApiResponse<Espacio>> {
    return apiRequest<Espacio>(`/espacios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  async eliminarEspacio(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/espacios/${id}`, { method: 'DELETE' });
  },
  
  // Tipos de Espacio
  async listarTiposEspacio(): Promise<ApiResponse<TipoEspacio[]>> {
    return apiRequest<TipoEspacio[]>('/tipos-espacio', { method: 'GET' });
  },
  
  async crearTipoEspacio(data: {
    nombre: string;
    descripcion?: string;
    color?: string;
  }): Promise<ApiResponse<TipoEspacio>> {
    return apiRequest<TipoEspacio>('/tipos-espacio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async actualizarTipoEspacio(id: number, data: {
    nombre: string;
    descripcion?: string;
    color?: string;
  }): Promise<ApiResponse<TipoEspacio>> {
    return apiRequest<TipoEspacio>(`/tipos-espacio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  async eliminarTipoEspacio(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/tipos-espacio/${id}`, { method: 'DELETE' });
  },
  
  // Inventory methods moved to frontend/src/lib/api/inventory.ts

  async obtenerEspacios(): Promise<ApiResponse<Espacio[]>> {
    return apiRequest<Espacio[]>('/espacios', { method: 'GET' });
  },

  // Edificios
  async listarEdificios(): Promise<ApiResponse<Edificio[]>> {
    return apiRequest<Edificio[]>('/edificios', { method: 'GET' });
  },

  // Gestión de imágenes de espacios
  async subirImagenEspacio(
    espacioId: number,
    file: File
  ): Promise<ApiResponse<{ objectName: string; imageUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    const url = `${API_BASE_URL}/espacios/${espacioId}/imagen`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // No establecer Content-Type, el navegador lo hará automáticamente con el boundary correcto
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error al subir la imagen' }));
      throw new Error(errorData.error || errorData.message || 'Error al subir la imagen');
    }

    return await response.json() as ApiResponse<{ objectName: string; imageUrl: string }>;
  },

  async eliminarImagenEspacio(espacioId: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/espacios/${espacioId}/imagen`, { method: 'DELETE' });
  },

  async obtenerUrlImagenEspacio(espacioId: number): Promise<ApiResponse<{ imageUrl: string | null; objectName: string | null }>> {
    return apiRequest<{ imageUrl: string | null; objectName: string | null }>(`/espacios/${espacioId}/imagen`, { method: 'GET' });
  },

  async obtenerEstadisticasEspacios(): Promise<ApiResponse<any>> {
    return apiRequest<any>('/espacios/stats', { method: 'GET' });
  },
};
