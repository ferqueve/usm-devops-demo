import { http } from '../http';
import type { Edificio, Espacio, EspacioStats, Page, TipoEspacio } from '../types';

export type EspacioFilters = {
  nombre?: string;
  estado?: string;
  tipoEspacioId?: number;
  edificioId?: number;
};

function toQuery(params: Record<string, unknown>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

/** GET /espacios/paged */
export function listarEspacios(
  page = 0,
  size = 20,
  filters: EspacioFilters = {},
): Promise<Page<Espacio>> {
  return http.get<Page<Espacio>>(`/espacios/paged${toQuery({ page, size, ...filters })}`);
}

/** GET /espacios — lista completa sin paginar. */
export function obtenerEspacios(): Promise<Espacio[]> {
  return http.get<Espacio[]>('/espacios');
}

/** GET /espacios/{id} */
export function obtenerEspacio(id: number): Promise<Espacio> {
  return http.get<Espacio>(`/espacios/${id}`);
}

/** GET /espacios/stats */
export function obtenerEstadisticasEspacios(): Promise<EspacioStats> {
  return http.get<EspacioStats>('/espacios/stats');
}

export type EspacioInput = {
  nombre: string;
  capacidad: number;
  tipoEspacioId: number;
  edificioId?: number;
  estado?: string;
};

/** POST /espacios */
export function crearEspacio(data: EspacioInput): Promise<Espacio> {
  return http.post<Espacio>('/espacios', data);
}

/** PUT /espacios/{id} */
export function actualizarEspacio(id: number, data: EspacioInput): Promise<Espacio> {
  return http.put<Espacio>(`/espacios/${id}`, data);
}

/** GET /tipos-espacio */
export function listarTiposEspacio(): Promise<TipoEspacio[]> {
  return http.get<TipoEspacio[]>('/tipos-espacio');
}

/** GET /edificios */
export function listarEdificios(): Promise<Edificio[]> {
  return http.get<Edificio[]>('/edificios');
}
