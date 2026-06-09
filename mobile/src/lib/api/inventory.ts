import { http } from '../http';
import type { InventarioItem, InventarioStats, Page, TipoElemento } from '../types';

export type InventarioFilters = {
  estado?: string;
  espacioId?: number;
  tipoElementoId?: number;
  search?: string;
};

function toQuery(params: Record<string, unknown>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

/** GET /inventario/paged */
export function listarInventario(
  page = 0,
  size = 20,
  filters: InventarioFilters = {},
): Promise<Page<InventarioItem>> {
  return http.get<Page<InventarioItem>>(`/inventario/paged${toQuery({ page, size, ...filters })}`);
}

/** GET /inventario/stats */
export function obtenerEstadisticasInventario(): Promise<InventarioStats> {
  return http.get<InventarioStats>('/inventario/stats');
}

/** GET /tipos-elemento */
export function listarTiposElemento(): Promise<TipoElemento[]> {
  return http.get<TipoElemento[]>('/tipos-elemento');
}

/** GET /inventario/espacio/{espacioId} — inventario asignado a un espacio. */
export function listarInventarioPorEspacio(espacioId: number): Promise<InventarioItem[]> {
  return http.get<InventarioItem[]>(`/inventario/espacio/${espacioId}`);
}

export type InventarioItemInput = {
  tipoElementoId: number;
  cantidad: number;
  espacioId?: number | null;
  estado?: string;
  observaciones?: string;
};

/** POST /inventario */
export function crearInventarioItem(data: InventarioItemInput): Promise<InventarioItem> {
  return http.post<InventarioItem>('/inventario', data);
}

/** PUT /inventario/{id} */
export function actualizarInventarioItem(
  id: number,
  data: InventarioItemInput,
): Promise<InventarioItem> {
  return http.put<InventarioItem>(`/inventario/${id}`, data);
}
