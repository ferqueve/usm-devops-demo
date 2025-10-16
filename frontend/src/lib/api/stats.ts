import { apiRequest, type ApiResponse } from './client';
import type { ActiveUsersStats } from '../types/system';

// API de estadísticas
export const statsApi = {
  // Obtener estadísticas de usuarios activos
  async getActiveUsers(): Promise<ApiResponse<ActiveUsersStats>> {
    return apiRequest<ActiveUsersStats>('/stats/active-users', {
      method: 'GET',
    });
  },
};
