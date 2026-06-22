import { apiRequest, type ApiResponse } from './client';
import type { SostenibilidadStats } from '../types/sostenibilidad';

export const sostenibilidadApi = {
  // Obtener KPIs de sostenibilidad (métricas derivadas)
  async obtenerStats(): Promise<ApiResponse<SostenibilidadStats>> {
    return apiRequest<SostenibilidadStats>('/stats/sostenibilidad', { method: 'GET' });
  },
};
