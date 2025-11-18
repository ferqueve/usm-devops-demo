import { apiRequest, type ApiResponse } from './client';
import { espaciosApi } from './spaces';
import { reservationsApi } from './reservations';
import { usuariosApi } from './users';
import { statsApi } from './stats';
import type { Reserva, ReservaStats, Espacio } from '../types/spaces';
import type { UserStats } from '../types/users';

export interface DashboardStats {
  // Reservas
  totalReservas: number;
  reservasHoy: number;
  reservasPendientes: number;
  reservasAprobadas: number;
  reservasCanceladas: number;
  
  // Espacios
  totalEspacios: number;
  espaciosDisponibles: number;
  espaciosOcupados: number;
  espaciosEnMantenimiento: number;
  capacidadPromedio: number;
  
  // Usuarios
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosNuevosHoy: number;
  
  // Ocupación
  ocupacionPromedio: number;
}

export interface EspacioStats {
  totalEspacios: number;
  capacidadPromedio: number;
  capacidadMaxima?: number;
  capacidadMinima?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  proximasReservas: Reserva[];
  reservasHoy: Reserva[];
  espacios: Espacio[];
  reservaStats?: ReservaStats;
  userStats?: UserStats;
}

// Funciones auxiliares para reducir complejidad
function extractReservasFromPromise(result: PromiseSettledResult<ApiResponse<Reserva[]>>): Reserva[] {
  return result.status === 'fulfilled' && result.value.data ? result.value.data : [];
}

function extractEspaciosFromPromise(result: PromiseSettledResult<ApiResponse<Espacio[]>>): Espacio[] {
  return result.status === 'fulfilled' && result.value.data ? result.value.data : [];
}

function extractEspacioStatsFromPromise(result: PromiseSettledResult<ApiResponse<EspacioStats>>): EspacioStats {
  return result.status === 'fulfilled' && result.value.data 
    ? result.value.data 
    : { totalEspacios: 0, capacidadPromedio: 0 };
}

function extractUserStatsFromPromise(result: PromiseSettledResult<UserStats>): UserStats | null {
  return result.status === 'fulfilled' && result.value ? result.value : null;
}

function extractReservaStatsFromPromise(result: PromiseSettledResult<ApiResponse<ReservaStats> | null>): ReservaStats | null {
  return result.status === 'fulfilled' && result.value?.data ? result.value.data : null;
}

function extractActiveUsersFromPromise(result: PromiseSettledResult<ApiResponse<{ totalActiveUsers: number }> | null>): { totalActiveUsers: number } | null {
  return result?.status === 'fulfilled' ? result.value?.data ?? null : null;
}

function calcularEstadisticasReservas(reservas: Reserva[], reservasHoyData: Reserva[]) {
  const reservasHoyCount = reservasHoyData.length;
  const reservasPendientes = reservas.filter(r => r.estado === 'PENDIENTE').length;
  const reservasAprobadas = reservas.filter(r => r.estado === 'APROBADO').length;
  const reservasCanceladas = reservas.filter(r => r.estado === 'CANCELADO').length;
  
  return { reservasHoyCount, reservasPendientes, reservasAprobadas, reservasCanceladas };
}

function obtenerProximasReservas(reservas: Reserva[], ahora: Date): Reserva[] {
  return reservas
    .filter(r => {
      const inicio = new Date(r.inicio);
      return inicio > ahora && r.estado === 'APROBADO';
    })
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
    .slice(0, 10);
}

function calcularEstadisticasEspacios(espacios: Espacio[]) {
  const espaciosDisponibles = espacios.filter(e => e.activo && e.estado === 'DISPONIBLE').length;
  const espaciosOcupados = espacios.filter(e => !e.activo || e.estado !== 'DISPONIBLE').length;
  const espaciosEnMantenimiento = espacios.filter(e => e.estado === 'MANTENIMIENTO').length;
  
  return { espaciosDisponibles, espaciosOcupados, espaciosEnMantenimiento };
}

export const dashboardApi = {
  // Obtener todas las estadísticas del dashboard
  async obtenerDatosDashboard(): Promise<DashboardData> {
    try {
      // Obtener datos en paralelo
      const [
        todasLasReservas,
        reservasHoy,
        espaciosRes,
        espaciosStatsRes,
        userStatsRes,
        reservaStatsRes,
        activeUsersRes
      ] = await Promise.allSettled([
        reservationsApi.obtenerTodasLasReservas(),
        reservationsApi.obtenerTodasLasReservas(
          undefined,
          undefined,
          undefined,
          undefined,
          new Date(new Date().setHours(0, 0, 0, 0)),
          new Date(new Date().setHours(23, 59, 59, 999))
        ),
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
        usuariosApi.obtenerEstadisticas(),
        reservationsApi.obtenerEstadisticasPersonales().catch(() => null),
        statsApi.getActiveUsers().catch(() => null)
      ]);

      const reservas = extractReservasFromPromise(todasLasReservas);
      const reservasHoyData = extractReservasFromPromise(reservasHoy);
      const espacios = extractEspaciosFromPromise(espaciosRes);
      const espaciosStats = extractEspacioStatsFromPromise(espaciosStatsRes);
      const userStats = extractUserStatsFromPromise(userStatsRes);
      const reservaStats = extractReservaStatsFromPromise(reservaStatsRes);
      const activeUsers = extractActiveUsersFromPromise(activeUsersRes);

      const ahora = new Date();
      const { reservasHoyCount, reservasPendientes, reservasAprobadas, reservasCanceladas } = 
        calcularEstadisticasReservas(reservas, reservasHoyData);
      const proximasReservas = obtenerProximasReservas(reservas, ahora);
      const { espaciosDisponibles, espaciosOcupados, espaciosEnMantenimiento } = 
        calcularEstadisticasEspacios(espacios);

      const ocupacionPromedio = espacios.length > 0
        ? Math.round((reservasAprobadas / espacios.length) * 100)
        : 0;

      const stats: DashboardStats = {
        totalReservas: reservas.length,
        reservasHoy: reservasHoyCount,
        reservasPendientes,
        reservasAprobadas,
        reservasCanceladas,
        totalEspacios: espaciosStats.totalEspacios || espacios.length,
        espaciosDisponibles,
        espaciosOcupados,
        espaciosEnMantenimiento,
        capacidadPromedio: espaciosStats.capacidadPromedio || 0,
        totalUsuarios: userStats?.totalUsuarios || 0,
        usuariosActivos: activeUsers?.totalActiveUsers || 0,
        usuariosNuevosHoy: 0, // No disponible en UserStats actual
        ocupacionPromedio
      };

      return {
        stats,
        proximasReservas,
        reservasHoy: reservasHoyData,
        espacios,
        reservaStats: reservaStats || undefined,
        userStats: userStats || undefined
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      throw error;
    }
  }
};

