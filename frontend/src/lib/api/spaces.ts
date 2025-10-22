import { apiRequest, type ApiResponse } from './client';
import type { 
  Espacio, 
  TipoEspacio, 
  InventarioItem, 
  TipoElemento, 
  EspacioFilters,
  PagedEspacios
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
    if (filters?.capacidadMin) params.append('capacidadMin', filters.capacidadMin.toString());
    if (filters?.capacidadMax) params.append('capacidadMax', filters.capacidadMax.toString());
    
    // Filtros de inventario múltiples
    if (filters?.filtrosInventario && filters.filtrosInventario.length > 0) {
      filters.filtrosInventario.forEach((filtro) => {
        params.append('tipoElementoIds', filtro.tipoElementoId.toString());
        if (filtro.cantidadMin !== undefined) {
          params.append('cantidadMins', filtro.cantidadMin.toString());
        }
        if (filtro.cantidadMax !== undefined) {
          params.append('cantidadMaxs', filtro.cantidadMax.toString());
        }
      });
    }
    
    return apiRequest<PagedEspacios>(`/espacios/paged?${params.toString()}`, { method: 'GET' });
  },
  
  // Filtros sin paginación (para usar cuando hay filtros activos)
  async filtrarEspacios(filters?: EspacioFilters): Promise<ApiResponse<Espacio[]>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipoEspacioId) params.append('tipoEspacioId', filters.tipoEspacioId.toString());
    if (filters?.capacidadMin) params.append('capacidadMin', filters.capacidadMin.toString());
    if (filters?.capacidadMax) params.append('capacidadMax', filters.capacidadMax.toString());
    
    // Filtros de inventario múltiples
    if (filters?.filtrosInventario && filters.filtrosInventario.length > 0) {
      filters.filtrosInventario.forEach((filtro) => {
        params.append('tipoElementoIds', filtro.tipoElementoId.toString());
        if (filtro.cantidadMin !== undefined) {
          params.append('cantidadMins', filtro.cantidadMin.toString());
        }
        if (filtro.cantidadMax !== undefined) {
          params.append('cantidadMaxs', filtro.cantidadMax.toString());
        }
      });
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
  
  // Inventario con paginación
  async listarInventarioPorEspacio(
    espacioId: number
  ): Promise<ApiResponse<InventarioItem[]>> {
    // Por ahora sin paginación en el endpoint, pero preparado para futuro
    return apiRequest<InventarioItem[]>(`/inventario/espacio/${espacioId}`, { method: 'GET' });
  },
  
  // Tipos de Elemento
  async listarTiposElemento(): Promise<ApiResponse<TipoElemento[]>> {
    return apiRequest<TipoElemento[]>('/tipos-elemento', { method: 'GET' });
  },
  
  // Gestión de Inventario
  async crearInventarioItem(data: {
    espacioId: number;
    tipoElementoId: number;
    cantidad: number;
    marca?: string;
    modelo?: string;
    numeroSerie?: string;
    estado: 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO';
    observaciones?: string;
    fechaAdquisicion?: string;
    valorEstimado?: number;
  }): Promise<ApiResponse<InventarioItem>> {
    return apiRequest<InventarioItem>('/inventario', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async actualizarInventarioItem(id: number, data: {
    espacioId: number;
    tipoElementoId: number;
    cantidad: number;
    marca?: string;
    modelo?: string;
    numeroSerie?: string;
    estado: 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO';
    observaciones?: string;
    fechaAdquisicion?: string;
    valorEstimado?: number;
  }): Promise<ApiResponse<InventarioItem>> {
    return apiRequest<InventarioItem>(`/inventario/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  async eliminarInventarioItem(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/inventario/${id}`, { method: 'DELETE' });
  },
};
