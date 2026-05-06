import { apiRequest, type ApiResponse } from './client';
import { espaciosApi } from './spaces';
import { inventarioApi } from './inventory';
import { reservationsApi } from './reservations';
import { usuariosApi } from './users';
import { statsApi } from './stats';
import { ROLES } from '../config/constants';
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

  // Promedio de reservas por espacio (ratio, no porcentaje)
  promedioReservasPorEspacio: number;
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

// =====================================================================
// Helpers genéricos para extraer payloads de Promise.allSettled.
// Centralizados para no repetir el patrón
//   `r.status === 'fulfilled' && r.value.data ? r.value.data : <fallback>`
// en cada uno de los seis dashboards por rol.
// =====================================================================

function settledValue<T>(result: PromiseSettledResult<T> | undefined): T | null {
  return result?.status === 'fulfilled' ? result.value : null;
}

function dataOrFallback<T>(result: PromiseSettledResult<ApiResponse<T>> | undefined, fallback: T): T {
  const value = settledValue(result);
  return (value && value.data !== undefined && value.data !== null ? value.data : fallback);
}

function extractReservas(result: PromiseSettledResult<ApiResponse<Reserva[]>> | undefined): Reserva[] {
  return dataOrFallback(result, [] as Reserva[]);
}

function extractEspacios(result: PromiseSettledResult<ApiResponse<Espacio[]>> | undefined): Espacio[] {
  return dataOrFallback(result, [] as Espacio[]);
}

function extractEspacioStats(result: PromiseSettledResult<ApiResponse<EspacioStats>> | undefined): EspacioStats {
  return dataOrFallback(result, { totalEspacios: 0, capacidadPromedio: 0 });
}

function extractUserStats(result: PromiseSettledResult<UserStats | null> | undefined): UserStats | null {
  return settledValue(result);
}

function extractReservaStats(
  result: PromiseSettledResult<ApiResponse<ReservaStats> | null> | undefined,
): ReservaStats | null {
  const value = settledValue(result);
  return value?.data ?? null;
}

function extractActiveUsers(
  result: PromiseSettledResult<ApiResponse<{ totalActiveUsers: number }> | null> | undefined,
): { totalActiveUsers: number } | null {
  const value = settledValue(result);
  return value?.data ?? null;
}

// =====================================================================
// Cálculos derivados de las listas crudas.
// =====================================================================

interface ReservasCounts {
  reservasHoyCount: number;
  reservasPendientes: number;
  reservasAprobadas: number;
  reservasCanceladas: number;
}

function calcularEstadisticasReservas(reservas: Reserva[], reservasHoyData: Reserva[]): ReservasCounts {
  return {
    reservasHoyCount: reservasHoyData.length,
    reservasPendientes: reservas.filter((r) => r.estado === 'PENDIENTE').length,
    reservasAprobadas: reservas.filter((r) => r.estado === 'APROBADO').length,
    reservasCanceladas: reservas.filter((r) => r.estado === 'CANCELADO').length,
  };
}

function obtenerProximasReservas(reservas: Reserva[], ahora: Date): Reserva[] {
  return reservas
    .filter((r) => {
      const inicio = new Date(r.inicio);
      return inicio > ahora && r.estado === 'APROBADO';
    })
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
    .slice(0, 10);
}

interface EspaciosCounts {
  espaciosDisponibles: number;
  espaciosOcupados: number;
  espaciosEnMantenimiento: number;
}

function calcularEstadisticasEspacios(espacios: Espacio[]): EspaciosCounts {
  return {
    espaciosDisponibles: espacios.filter((e) => e.activo && e.estado === 'DISPONIBLE').length,
    espaciosOcupados: espacios.filter((e) => !e.activo || e.estado !== 'DISPONIBLE').length,
    espaciosEnMantenimiento: espacios.filter((e) => e.estado === 'MANTENIMIENTO').length,
  };
}

function filtrarReservasHoy(reservas: Reserva[]): Reserva[] {
  const { hoy, finHoy } = rangoHoy();
  return reservas.filter((r) => {
    const inicio = new Date(r.inicio);
    return inicio >= hoy && inicio <= finHoy;
  });
}

function rangoHoy(): { hoy: Date; finHoy: Date } {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  return { hoy, finHoy };
}

function calcularPromedioReservasPorEspacio(reservasAprobadas: number, totalEspacios: number): number {
  return totalEspacios > 0 ? Number.parseFloat((reservasAprobadas / totalEspacios).toFixed(1)) : 0;
}

// =====================================================================
// Builder común de DashboardStats. Cada dashboard de rol prepara los
// inputs y llama a este builder, en lugar de armar manualmente el objeto.
// =====================================================================

interface BuildStatsInput {
  reservas: Reserva[];
  reservasHoyData: Reserva[];
  espacios: Espacio[];
  espaciosStats: EspacioStats;
  userStats?: UserStats | null;
  activeUsers?: { totalActiveUsers: number } | null;
  /** Override de reservasPendientes (para el caso EXTERNO que cuenta sus propias solicitudes). */
  overridePendientes?: number;
  /** Si se pasa true, los counters de reservas se ponen en cero (caso MANTENIMIENTO). */
  reservasZeroed?: boolean;
}

function buildDashboardStats(input: BuildStatsInput): DashboardStats {
  const { reservas, reservasHoyData, espacios, espaciosStats, userStats, activeUsers, overridePendientes, reservasZeroed } = input;

  if (reservasZeroed) {
    const espaciosCounts = calcularEstadisticasEspacios(espacios);
    return {
      totalReservas: reservas.length,
      reservasHoy: 0,
      reservasPendientes: 0,
      reservasAprobadas: 0,
      reservasCanceladas: 0,
      totalEspacios: espaciosStats.totalEspacios || espacios.length,
      ...espaciosCounts,
      capacidadPromedio: espaciosStats.capacidadPromedio || 0,
      totalUsuarios: 0,
      usuariosActivos: 0,
      usuariosNuevosHoy: 0,
      promedioReservasPorEspacio: 0,
    };
  }

  const reservasCounts = calcularEstadisticasReservas(reservas, reservasHoyData);
  const espaciosCounts = calcularEstadisticasEspacios(espacios);
  const promedioReservasPorEspacio = calcularPromedioReservasPorEspacio(
    reservasCounts.reservasAprobadas,
    espacios.length,
  );

  return {
    totalReservas: reservas.length,
    reservasHoy: reservasCounts.reservasHoyCount,
    reservasPendientes: overridePendientes ?? reservasCounts.reservasPendientes,
    reservasAprobadas: reservasCounts.reservasAprobadas,
    reservasCanceladas: reservasCounts.reservasCanceladas,
    totalEspacios: espaciosStats.totalEspacios || espacios.length,
    ...espaciosCounts,
    capacidadPromedio: espaciosStats.capacidadPromedio || 0,
    totalUsuarios: userStats?.totalUsuarios || 0,
    usuariosActivos: activeUsers?.totalActiveUsers || 0,
    usuariosNuevosHoy: 0,
    promedioReservasPorEspacio,
  };
}

// =====================================================================
// Implementaciones de dashboard por rol.
// =====================================================================

export const dashboardApi = {
  // Función principal que redirige según rol (mantener para compatibilidad)
  async obtenerDatosDashboard(userRole?: string): Promise<DashboardData> {
    switch (userRole) {
      case ROLES.ADMIN:
        return this.obtenerDatosDashboardAdmin();
      case ROLES.ANALISTA:
        return this.obtenerDatosDashboardAnalista();
      case ROLES.MANTENIMIENTO:
        return this.obtenerDatosDashboardMantenimiento();
      case ROLES.DOCENTE:
        return this.obtenerDatosDashboardDocente();
      case ROLES.ESTUDIANTE:
        return this.obtenerDatosDashboardEstudiante();
      case ROLES.EXTERNO:
        return this.obtenerDatosDashboardExterno();
      default:
        return this.obtenerDatosDashboardEstudiante();
    }
  },

  // Dashboard ADMIN - Acceso completo
  async obtenerDatosDashboardAdmin(): Promise<DashboardData> {
    try {
      const { hoy, finHoy } = rangoHoy();

      const results = await Promise.allSettled([
        reservationsApi.obtenerTodasLasReservas(),
        reservationsApi.obtenerTodasLasReservas(undefined, undefined, undefined, undefined, hoy, finHoy),
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
        usuariosApi.obtenerEstadisticas().catch(() => null),
        reservationsApi.obtenerEstadisticasPersonales().catch(() => null),
        statsApi.getActiveUsers().catch(() => null),
        inventarioApi.obtenerEstadisticasInventario().catch(() => null),
      ]);

      const [todasLasReservas, reservasHoy, espaciosRes, espaciosStatsRes, userStatsRes, reservaStatsRes, activeUsersRes] = results;

      const reservas = extractReservas(todasLasReservas as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const reservasHoyData = extractReservas(reservasHoy as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const espacios = extractEspacios(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStats(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);
      const userStats = extractUserStats(userStatsRes as PromiseSettledResult<UserStats | null>);
      const reservaStats = extractReservaStats(reservaStatsRes as PromiseSettledResult<ApiResponse<ReservaStats> | null>);
      const activeUsers = extractActiveUsers(activeUsersRes as PromiseSettledResult<ApiResponse<{ totalActiveUsers: number }> | null>);

      const stats = buildDashboardStats({
        reservas,
        reservasHoyData,
        espacios,
        espaciosStats,
        userStats,
        activeUsers,
      });

      return {
        stats,
        proximasReservas: obtenerProximasReservas(reservas, new Date()),
        reservasHoy: reservasHoyData,
        espacios,
        reservaStats: reservaStats || undefined,
        userStats: userStats || undefined,
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard ADMIN:', error);
      throw error;
    }
  },

  // Dashboard ANALISTA - Enfocado en reservas
  async obtenerDatosDashboardAnalista(): Promise<DashboardData> {
    try {
      const { hoy, finHoy } = rangoHoy();

      const results = await Promise.allSettled([
        reservationsApi.obtenerTodasLasReservas(),
        reservationsApi.obtenerTodasLasReservas(undefined, undefined, undefined, undefined, hoy, finHoy),
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
        reservationsApi.obtenerEstadisticasPersonales().catch(() => null),
        inventarioApi.obtenerEstadisticasInventario().catch(() => null),
      ]);

      const [todasLasReservas, reservasHoy, espaciosRes, espaciosStatsRes, reservaStatsRes] = results;

      const reservas = extractReservas(todasLasReservas as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const reservasHoyData = extractReservas(reservasHoy as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const espacios = extractEspacios(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStats(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);
      const reservaStats = extractReservaStats(reservaStatsRes as PromiseSettledResult<ApiResponse<ReservaStats> | null>);

      const stats = buildDashboardStats({ reservas, reservasHoyData, espacios, espaciosStats });

      return {
        stats,
        proximasReservas: obtenerProximasReservas(reservas, new Date()),
        reservasHoy: reservasHoyData,
        espacios,
        reservaStats: reservaStats || undefined,
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard ANALISTA:', error);
      throw error;
    }
  },

  // Dashboard MANTENIMIENTO - Enfocado en espacios e inventario
  async obtenerDatosDashboardMantenimiento(): Promise<DashboardData> {
    try {
      const results = await Promise.allSettled([
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
        inventarioApi.obtenerEstadisticasInventario().catch(() => null),
        reservationsApi.obtenerTodasLasReservas().catch(() => null),
      ]);

      const [espaciosRes, espaciosStatsRes, , reservasRes] = results;

      const espacios = extractEspacios(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStats(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);
      const reservas = extractReservas(reservasRes as PromiseSettledResult<ApiResponse<Reserva[]>>);

      const stats = buildDashboardStats({
        reservas,
        reservasHoyData: [],
        espacios,
        espaciosStats,
        reservasZeroed: true,
      });

      return {
        stats,
        proximasReservas: [],
        reservasHoy: [],
        espacios,
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard MANTENIMIENTO:', error);
      throw error;
    }
  },

  // Dashboard DOCENTE - Sus reservas personales
  async obtenerDatosDashboardDocente(): Promise<DashboardData> {
    try {
      const results = await Promise.allSettled([
        reservationsApi.obtenerMisReservas(),
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
        reservationsApi.obtenerEstadisticasPersonales().catch(() => null),
        reservationsApi.obtenerTodasLasReservas().catch(() => null),
      ]);

      const [misReservas, espaciosRes, espaciosStatsRes, reservaStatsRes] = results;

      const reservas = extractReservas(misReservas as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const reservasHoyData = filtrarReservasHoy(reservas);
      const espacios = extractEspacios(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStats(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);
      const reservaStats = extractReservaStats(reservaStatsRes as PromiseSettledResult<ApiResponse<ReservaStats> | null>);

      const stats = buildDashboardStats({ reservas, reservasHoyData, espacios, espaciosStats });

      return {
        stats,
        proximasReservas: obtenerProximasReservas(reservas, new Date()),
        reservasHoy: reservasHoyData,
        espacios,
        reservaStats: reservaStats || undefined,
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard DOCENTE:', error);
      throw error;
    }
  },

  // Dashboard ESTUDIANTE - Solo lectura
  async obtenerDatosDashboardEstudiante(): Promise<DashboardData> {
    try {
      const results = await Promise.allSettled([
        reservationsApi.obtenerTodasLasReservas(),
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
      ]);

      const [todasLasReservas, espaciosRes, espaciosStatsRes] = results;

      const reservas = extractReservas(todasLasReservas as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const reservasHoyData = filtrarReservasHoy(reservas);
      const espacios = extractEspacios(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStats(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);

      const stats = buildDashboardStats({ reservas, reservasHoyData, espacios, espaciosStats });

      return {
        stats,
        proximasReservas: obtenerProximasReservas(reservas, new Date()),
        reservasHoy: reservasHoyData,
        espacios,
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard ESTUDIANTE:', error);
      throw error;
    }
  },

  // Dashboard EXTERNO - Solo muestra información de reservas públicas
  // Nota: obtenerTodasLasReservas() ya filtra automáticamente por reservas públicas para usuarios externos en el backend
  async obtenerDatosDashboardExterno(): Promise<DashboardData> {
    try {
      const results = await Promise.allSettled([
        reservationsApi.obtenerTodasLasReservas(),
        reservationsApi.obtenerMisReservas().catch(() => null),
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
      ]);

      const [todasLasReservas, misReservasRes, espaciosRes, espaciosStatsRes] = results;

      const reservasPublicas = extractReservas(todasLasReservas as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const misReservas = extractReservas(misReservasRes as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const reservasHoyData = filtrarReservasHoy(reservasPublicas);
      const espacios = extractEspacios(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStats(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);

      const misReservasPendientes = misReservas.filter((r) => r.estado === 'PENDIENTE').length;

      const stats = buildDashboardStats({
        reservas: reservasPublicas,
        reservasHoyData,
        espacios,
        espaciosStats,
        overridePendientes: misReservasPendientes,
      });

      return {
        stats,
        proximasReservas: obtenerProximasReservas(reservasPublicas, new Date()),
        reservasHoy: reservasHoyData,
        espacios,
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard EXTERNO:', error);
      throw error;
    }
  },
};
