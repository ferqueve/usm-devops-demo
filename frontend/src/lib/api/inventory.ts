import { apiRequest, type ApiResponse } from './client';
import { reservationsApi } from './reservations';
import type {
  ReservaItemSolicitado,
  InventarioItem,
  TipoElemento,
  PagedInventario,
  InventoryStats
} from '../types/spaces';

export interface InventorySummary {
  totalItems: number;
  disponibles: number;
  enMantenimiento: number;
  danados: number;
  sinAsignar: number;
}

export const inventarioApi = {
  async listarInventarioPorEspacio(espacioId: number): Promise<ApiResponse<InventarioItem[]>> {
    return apiRequest<InventarioItem[]>(`/inventario/espacio/${espacioId}`, { method: 'GET' });
  },

  async listarTiposElemento(): Promise<ApiResponse<TipoElemento[]>> {
    return apiRequest<TipoElemento[]>('/tipos-elemento', { method: 'GET' });
  },

  async crearTipoElemento(data: { nombre: string; descripcion?: string; }): Promise<ApiResponse<TipoElemento>> {
    return apiRequest<TipoElemento>('/tipos-elemento', { method: 'POST', body: JSON.stringify(data) });
  },

  async actualizarTipoElemento(id: number, data: { nombre: string; descripcion?: string; }): Promise<ApiResponse<TipoElemento>> {
    return apiRequest<TipoElemento>(`/tipos-elemento/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async eliminarTipoElemento(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/tipos-elemento/${id}`, { method: 'DELETE' });
  },

  async crearInventarioItem(data: any): Promise<ApiResponse<InventarioItem>> {
    return apiRequest<InventarioItem>('/inventario', { method: 'POST', body: JSON.stringify(data) });
  },

  async actualizarInventarioItem(id: number, data: any): Promise<ApiResponse<InventarioItem>> {
    return apiRequest<InventarioItem>(`/inventario/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async eliminarInventarioItem(id: number): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/inventario/${id}`, { method: 'DELETE' });
  },

  async listarInventario(page: number = 0, size: number = 12, filters?: any, sortBy?: string, sortDir?: 'asc' | 'desc'): Promise<ApiResponse<PagedInventario>> {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (filters?.search) params.append('search', filters.search);
    if (filters?.espacioId) params.append('espacioId', filters.espacioId.toString());
    if (filters?.tipoElementoId) params.append('tipoElementoId', filters.tipoElementoId.toString());
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.sinAsignar === true) params.append('sinAsignar', 'true');
    if (sortBy && sortDir) params.append('sort', `${sortBy},${sortDir}`);
    return apiRequest<PagedInventario>(`/inventario/paged?${params.toString()}`, { method: 'GET' });
  },

  async filtrarInventario(filters?: any, sortBy?: string, sortDir?: 'asc' | 'desc'): Promise<ApiResponse<InventarioItem[]>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.espacioId) params.append('espacioId', filters.espacioId.toString());
    if (filters?.tipoElementoId) params.append('tipoElementoId', filters.tipoElementoId.toString());
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.sinAsignar === true) params.append('sinAsignar', 'true');
    if (sortBy) params.append('sortBy', sortBy);
    if (sortDir) params.append('sortDir', sortDir);
    return apiRequest<InventarioItem[]>(`/inventario/filter?${params.toString()}`, { method: 'GET' });
  },

  async obtenerEstadisticasInventario(): Promise<ApiResponse<InventoryStats>> {
    return apiRequest<InventoryStats>('/inventario/stats', { method: 'GET' });
  },

  async obtenerEstadisticasDetalladasInventario(espacioId?: number | null, tipoElementoId?: number | null, estado?: string): Promise<ApiResponse<InventoryStats>> {
    const params = new URLSearchParams();
    if (espacioId !== null && espacioId !== undefined) params.append('espacioId', espacioId.toString());
    if (tipoElementoId !== null && tipoElementoId !== undefined) params.append('tipoElementoId', tipoElementoId.toString());
    if (estado && estado !== 'todos') params.append('estado', estado);
    const queryString = params.toString();
    return apiRequest<InventoryStats>(`/stats/inventario/detailed${queryString ? '?' + queryString : ''}`, { method: 'GET' });
  },

  async obtenerTodoElInventario(): Promise<ApiResponse<InventarioItem[]>> {
    return apiRequest<InventarioItem[]>('/inventario', { method: 'GET' });
  },

  async obtenerSolicitudesPendientes(): Promise<ApiResponse<ReservaItemSolicitado[]>> {
    const res = await reservationsApi.listarSolicitudesInventario({ estados: ['PENDIENTE'], page: 0, size: 50 });
    const content = res.data && (res.data as any).content ? (res.data as any).content as ReservaItemSolicitado[] : (res.data as any) || [];
    return { success: res.success, message: res.message, data: content } as ApiResponse<ReservaItemSolicitado[]>;
  }
};

export default inventarioApi;
