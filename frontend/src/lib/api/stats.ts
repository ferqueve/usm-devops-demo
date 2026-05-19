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

export interface EvolucionEstadoPunto {
  fecha: string;
  disponibles: number;
  mantenimiento: number;
  danados: number;
}

export interface EvolucionParquePunto {
  fecha: string;
  items: number;
  unidades: number;
}

export interface DeltaInventarioFila {
  espacioId: number;
  espacioNombre: string;
  itemsInicio: number;
  itemsFin: number;
  unidadesInicio: number;
  unidadesFin: number;
  deltaItems: number;
  deltaUnidades: number;
}

export interface DeltaInventario {
  fechaInicio: string;
  fechaFin: string;
  porEspacio: DeltaInventarioFila[];
}

export interface MatrizEspacio {
  espacioId: number;
  espacioNombre: string;
}

export interface MatrizTipo {
  tipoId: number;
  tipoNombre: string;
}

export interface MatrizCelda {
  espacioId: number;
  tipoId: number;
  total: number;
}

export interface MatrizEspacioTipo {
  espacios: MatrizEspacio[];
  tipos: MatrizTipo[];
  celdas: MatrizCelda[];
}

export interface ForecastHistoricoPunto {
  fecha: string;
  real: number;
}

export interface ForecastPrediccionPunto {
  fecha: string;
  prediccion: number;
  bandaInferior: number | null;
  bandaSuperior: number | null;
}

export interface ForecastDemanda {
  modeloId: number | null;
  trainedAt: string | null;
  mape: number | null;
  historico: ForecastHistoricoPunto[];
  predicciones: ForecastPrediccionPunto[];
}

export interface CalidadModelo {
  modeloId: number | null;
  algoritmo?: string;
  trainedAt?: string;
  sampleSize?: number;
  holdoutSize?: number;
  mape?: number | null;
  mae?: number | null;
  notas?: string;
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

  async evolucionEstadoInventario(rango: RangoFechas): Promise<ApiResponse<EvolucionEstadoPunto[]>> {
    return apiRequest<EvolucionEstadoPunto[]>(`/stats/inventario/evolucion-estado${buildRangeQuery(rango)}`, { method: 'GET' });
  },

  async evolucionParqueInventario(rango: RangoFechas): Promise<ApiResponse<EvolucionParquePunto[]>> {
    return apiRequest<EvolucionParquePunto[]>(`/stats/inventario/evolucion-parque${buildRangeQuery(rango)}`, { method: 'GET' });
  },

  async deltaInventario(fechaInicio: string, fechaFin: string): Promise<ApiResponse<DeltaInventario>> {
    const qs = `?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`;
    return apiRequest<DeltaInventario>(`/stats/inventario/delta${qs}`, { method: 'GET' });
  },

  async matrizEspacioTipo(): Promise<ApiResponse<MatrizEspacioTipo>> {
    return apiRequest<MatrizEspacioTipo>('/stats/inventario/matriz-espacio-tipo', { method: 'GET' });
  },

  async forecastDemanda(diasHistorico = 90): Promise<ApiResponse<ForecastDemanda>> {
    return apiRequest<ForecastDemanda>(`/stats/ml/forecast?diasHistorico=${diasHistorico}`, { method: 'GET' });
  },

  async calidadModeloML(): Promise<ApiResponse<CalidadModelo>> {
    return apiRequest<CalidadModelo>('/stats/ml/calidad-modelo', { method: 'GET' });
  },

  async reentrenarModeloML(): Promise<ApiResponse<Record<string, unknown>>> {
    return apiRequest<Record<string, unknown>>('/stats/ml/reentrenar', { method: 'POST' });
  },
};
