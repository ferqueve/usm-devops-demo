// ============================================================================
// Tipos para sistema y estadísticas
// ============================================================================

export interface ActiveUser {
  email: string;
  nombre: string;
  apellido?: string; // Para compatibilidad con código existente
  rol: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
}

export interface ActiveUsersStats {
  totalActiveUsers: number;
  activeUsers: ActiveUser[];
}

