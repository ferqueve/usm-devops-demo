import { apiRequest, type ApiResponse } from './client';
import type { SostenibilidadRanking, SostenibilidadStats } from '../types/sostenibilidad';

export const sostenibilidadApi = {
  // Obtener KPIs de sostenibilidad (métricas derivadas)
  async obtenerStats(): Promise<ApiResponse<SostenibilidadStats>> {
    return apiRequest<SostenibilidadStats>('/stats/sostenibilidad', { method: 'GET' });
  },

  // Ranking de carreras/docentes + comparativa mensual
  async obtenerRanking(): Promise<ApiResponse<SostenibilidadRanking>> {
    return apiRequest<SostenibilidadRanking>('/stats/sostenibilidad/ranking', { method: 'GET' });
  },
};
