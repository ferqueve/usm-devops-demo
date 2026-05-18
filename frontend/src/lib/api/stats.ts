import { apiRequest, type ApiResponse } from './client';
import type { ActiveUsersStats } from '../types/system';

export interface OcupacionEspacio {
  espacioId: number;
  espacioNombre: string;
  horasReservadas: number;
  horasDisponibles: number;
  porcentaje: number;
}

export interface HeatmapCelda {
  diaSemana: number;
  hora: number;
  cant: number;
}

export interface ResumenCarrera {
  carreraId: number | null;
  carreraNombre: string;
  aprobadas: number;
  canceladas: number;
  tasaCancelacion: number;
}

export interface ResumenEdificio {
  edificioId: number | null;
  edificioNombre: string;
  cantReservas: number;
}

export interface TopUsuario {
  usuarioId: number;
  nombre: string;
  email: string;
  cantReservas: number;
}

interface RangoFechas {
  desde: string;
  hasta: string;
}

const buildRangeQuery = ({ desde, hasta }: RangoFechas) =>
  `?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;

export const statsApi = {
  async getActiveUsers(): Promise<ApiResponse<ActiveUsersStats>> {
    return apiRequest<ActiveUsersStats>('/stats/active-users', { method: 'GET' });
  },

  async ocupacionPorEspacio(rango: RangoFechas): Promise<ApiResponse<OcupacionEspacio[]>> {
    return apiRequest<OcupacionEspacio[]>(`/stats/reservas/ocupacion${buildRangeQuery(rango)}`, { method: 'GET' });
  },

  async heatmapDiaHora(rango: RangoFechas): Promise<ApiResponse<HeatmapCelda[]>> {
    return apiRequest<HeatmapCelda[]>(`/stats/reservas/heatmap${buildRangeQuery(rango)}`, { method: 'GET' });
  },

  async resumenPorCarrera(rango: RangoFechas): Promise<ApiResponse<ResumenCarrera[]>> {
    return apiRequest<ResumenCarrera[]>(`/stats/reservas/por-carrera${buildRangeQuery(rango)}`, { method: 'GET' });
  },

  async resumenPorEdificio(rango: RangoFechas): Promise<ApiResponse<ResumenEdificio[]>> {
    return apiRequest<ResumenEdificio[]>(`/stats/reservas/por-edificio${buildRangeQuery(rango)}`, { method: 'GET' });
  },

  async topUsuarios(rango: RangoFechas & { limite?: number }): Promise<ApiResponse<TopUsuario[]>> {
    const base = `/stats/reservas/top-usuarios${buildRangeQuery(rango)}`;
    const url = rango.limite ? `${base}&limite=${rango.limite}` : base;
    return apiRequest<TopUsuario[]>(url, { method: 'GET' });
  },
};
