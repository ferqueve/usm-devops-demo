import { apiRequest, type ApiResponse } from './client';
import { API_BASE_URL } from '@/lib/config/api';
import type {
  Espacio,
  TipoEspacio,
  EspacioFilters,
  PagedEspacios,
  Edificio,
  EspacioStats
} from '../types/spaces';

// Helpers para reducir complejidad cognitiva en los filtros de Espacios

function appendIfDefined(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined | null
): void {
  if (value !== undefined && value !== null && value !== '') {
    params.append(key, value.toString());
  }
}

function appendInventoryFilters(
  params: URLSearchParams,
  filtros?: EspacioFilters['filtrosInventario']
): void {
  if (!filtros?.length) return;
  for (const filtro of filtros) {
    params.append('tipoElementoIds', filtro.tipoElementoId.toString());
    appendIfDefined(params, 'cantidadMins', filtro.cantidadMin);
    appendIfDefined(params, 'cantidadMaxs', filtro.cantidadMax);
  }
}

function buildEspacioFilterParams(filters?: EspacioFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;
  appendIfDefined(params, 'search', filters.search);
  appendIfDefined(params, 'tipoEspacioId', filters.tipoEspacioId);
  appendIfDefined(params, 'edificioId', filters.edificioId);
  appendIfDefined(params, 'capacidadMin', filters.capacidadMin);
  appendIfDefined(params, 'capacidadMax', filters.capacidadMax);
  appendIfDefined(params, 'estado', filters.estado);
  appendInventoryFilters(params, filters.filtrosInventario);
  return params;
}

export const espaciosApi = {
  // Espacios con paginación
  async listarEspacios(
    page: number = 0,
    size: number = 12,
    filters?: EspacioFilters
  ): Promise<ApiResponse<PagedEspacios>> {
    const params = buildEspacioFilterParams(filters);
    params.set('page', page.toString());
    params.set('size', size.toString());
    return apiRequest<PagedEspacios>(`/espacios/paged?${params.toString()}`, { method: 'GET' });
  },

  // Filtros sin paginación (para usar cuando hay filtros activos)
  async filtrarEspacios(filters?: EspacioFilters): Promise<ApiResponse<Espacio[]>> {
    const params = buildEspacioFilterParams(filters);
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

  async obtenerEstadisticasEspacios(): Promise<ApiResponse<EspacioStats>> {
    return apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' });
  },
};
