import { apiRequest, type ApiResponse } from './client';
import { espaciosApi } from './spaces';
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

function extractUserStatsFromPromise(result: PromiseSettledResult<UserStats | null>): UserStats | null {
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

// Función auxiliar para filtrar reservas de hoy
function filtrarReservasHoy(reservas: Reserva[]): Reserva[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  
  return reservas.filter(r => {
    const inicio = new Date(r.inicio);
    return inicio >= hoy && inicio <= finHoy;
  });
}

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
        // Por defecto, usar dashboard básico
        return this.obtenerDatosDashboardEstudiante();
    }
  },

  // Dashboard ADMIN - Acceso completo
  async obtenerDatosDashboardAdmin(): Promise<DashboardData> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finHoy = new Date();
      finHoy.setHours(23, 59, 59, 999);

      const promises = [
        reservationsApi.obtenerTodasLasReservas(),
        reservationsApi.obtenerTodasLasReservas(undefined, undefined, undefined, undefined, hoy, finHoy),
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
        usuariosApi.obtenerEstadisticas().catch(() => null),
        reservationsApi.obtenerEstadisticasPersonales().catch(() => null),
        statsApi.getActiveUsers().catch(() => null),
        espaciosApi.obtenerEstadisticasInventario().catch(() => null),
      ];

      const results = await Promise.allSettled(promises);
      const [
        todasLasReservas,
        reservasHoy,
        espaciosRes,
        espaciosStatsRes,
        userStatsRes,
        reservaStatsRes,
        activeUsersRes
      ] = results;

      const reservas = extractReservasFromPromise(todasLasReservas as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const reservasHoyData = extractReservasFromPromise(reservasHoy as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const espacios = extractEspaciosFromPromise(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStatsFromPromise(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);
      const userStats = extractUserStatsFromPromise(userStatsRes as PromiseSettledResult<UserStats | null>);
      const reservaStats = extractReservaStatsFromPromise(reservaStatsRes as PromiseSettledResult<ApiResponse<ReservaStats> | null>);
      const activeUsers = extractActiveUsersFromPromise(activeUsersRes as PromiseSettledResult<ApiResponse<{ totalActiveUsers: number }> | null>);

      const ahora = new Date();
      const { reservasHoyCount, reservasPendientes, reservasAprobadas, reservasCanceladas } = 
        calcularEstadisticasReservas(reservas, reservasHoyData);
      const proximasReservas = obtenerProximasReservas(reservas, ahora);
      const { espaciosDisponibles, espaciosOcupados, espaciosEnMantenimiento } = 
        calcularEstadisticasEspacios(espacios);

      // Calcular promedio de reservas aprobadas por espacio (como ratio, no porcentaje)
      const promedioReservasPorEspacio = espacios.length > 0
        ? parseFloat((reservasAprobadas / espacios.length).toFixed(1))
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
        usuariosNuevosHoy: 0,
        promedioReservasPorEspacio
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
      console.error('Error al obtener datos del dashboard ADMIN:', error);
      throw error;
    }
  },

  // Dashboard ANALISTA - Enfocado en reservas
  async obtenerDatosDashboardAnalista(): Promise<DashboardData> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finHoy = new Date();
      finHoy.setHours(23, 59, 59, 999);

      const promises = [
        reservationsApi.obtenerTodasLasReservas(),
        reservationsApi.obtenerTodasLasReservas(undefined, undefined, undefined, undefined, hoy, finHoy),
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
        reservationsApi.obtenerEstadisticasPersonales().catch(() => null),
        espaciosApi.obtenerEstadisticasInventario().catch(() => null),
      ];

      const results = await Promise.allSettled(promises);
      const [
        todasLasReservas,
        reservasHoy,
        espaciosRes,
        espaciosStatsRes,
        reservaStatsRes
      ] = results;

      const reservas = extractReservasFromPromise(todasLasReservas as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const reservasHoyData = extractReservasFromPromise(reservasHoy as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const espacios = extractEspaciosFromPromise(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStatsFromPromise(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);
      const reservaStats = extractReservaStatsFromPromise(reservaStatsRes as PromiseSettledResult<ApiResponse<ReservaStats> | null>);
      
      // inventarioStatsRes no se usa en este dashboard, se omite

      const ahora = new Date();
      const { reservasHoyCount, reservasPendientes, reservasAprobadas, reservasCanceladas } = 
        calcularEstadisticasReservas(reservas, reservasHoyData);
      const proximasReservas = obtenerProximasReservas(reservas, ahora);
      const { espaciosDisponibles, espaciosOcupados, espaciosEnMantenimiento } =
        calcularEstadisticasEspacios(espacios);

      // Calcular promedio de reservas aprobadas por espacio (como ratio, no porcentaje)
      const promedioReservasPorEspacio = espacios.length > 0
        ? parseFloat((reservasAprobadas / espacios.length).toFixed(1))
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
        totalUsuarios: 0,
        usuariosActivos: 0,
        usuariosNuevosHoy: 0,
        promedioReservasPorEspacio
      };

      return {
        stats,
        proximasReservas,
        reservasHoy: reservasHoyData,
        espacios,
        reservaStats: reservaStats || undefined
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard ANALISTA:', error);
      throw error;
    }
  },

  // Dashboard MANTENIMIENTO - Enfocado en espacios e inventario
  async obtenerDatosDashboardMantenimiento(): Promise<DashboardData> {
    try {
      const promises = [
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
        espaciosApi.obtenerEstadisticasInventario().catch(() => null),
        reservationsApi.obtenerTodasLasReservas().catch(() => null), // Solo lectura para ver ocupación
      ];

      const results = await Promise.allSettled(promises);
      const [
        espaciosRes,
        espaciosStatsRes,
        , // inventarioStatsRes - no se usa en este dashboard
        reservasRes
      ] = results;

      const espacios = extractEspaciosFromPromise(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStatsFromPromise(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);
      const reservas: Reserva[] = reservasRes?.status === 'fulfilled' && reservasRes.value && 'data' in reservasRes.value && Array.isArray(reservasRes.value.data)
        ? (reservasRes.value.data as Reserva[])
        : [];

      const { espaciosDisponibles, espaciosOcupados, espaciosEnMantenimiento } = 
        calcularEstadisticasEspacios(espacios);

      const stats: DashboardStats = {
        totalReservas: reservas.length,
        reservasHoy: 0,
        reservasPendientes: 0,
        reservasAprobadas: 0,
        reservasCanceladas: 0,
        totalEspacios: espaciosStats.totalEspacios || espacios.length,
        espaciosDisponibles,
        espaciosOcupados,
        espaciosEnMantenimiento,
        capacidadPromedio: espaciosStats.capacidadPromedio || 0,
        totalUsuarios: 0,
        usuariosActivos: 0,
        usuariosNuevosHoy: 0,
        ocupacionPromedio: 0
      };

      return {
        stats,
        proximasReservas: [],
        reservasHoy: [],
        espacios
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard MANTENIMIENTO:', error);
      throw error;
    }
  },

  // Dashboard DOCENTE - Sus reservas personales
  async obtenerDatosDashboardDocente(): Promise<DashboardData> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finHoy = new Date();
      finHoy.setHours(23, 59, 59, 999);

      const promises = [
        reservationsApi.obtenerMisReservas(),
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
        reservationsApi.obtenerEstadisticasPersonales().catch(() => null),
        reservationsApi.obtenerTodasLasReservas().catch(() => null), // Para ver todas las reservas (lectura)
      ];

      const results = await Promise.allSettled(promises);
      const [
        misReservas,
        espaciosRes,
        espaciosStatsRes,
        reservaStatsRes
      ] = results;

      const reservas = extractReservasFromPromise(misReservas as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const reservasHoyData = filtrarReservasHoy(reservas);
      const espacios = extractEspaciosFromPromise(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStatsFromPromise(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);
      const reservaStats = extractReservaStatsFromPromise(reservaStatsRes as PromiseSettledResult<ApiResponse<ReservaStats> | null>);

      const ahora = new Date();
      const { reservasHoyCount, reservasPendientes, reservasAprobadas, reservasCanceladas } = 
        calcularEstadisticasReservas(reservas, reservasHoyData);
      const proximasReservas = obtenerProximasReservas(reservas, ahora);
      const { espaciosDisponibles, espaciosOcupados, espaciosEnMantenimiento } =
        calcularEstadisticasEspacios(espacios);

      // Calcular promedio de reservas aprobadas por espacio (como ratio, no porcentaje)
      const promedioReservasPorEspacio = espacios.length > 0
        ? parseFloat((reservasAprobadas / espacios.length).toFixed(1))
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
        totalUsuarios: 0,
        usuariosActivos: 0,
        usuariosNuevosHoy: 0,
        promedioReservasPorEspacio
      };

      return {
        stats,
        proximasReservas,
        reservasHoy: reservasHoyData,
        espacios,
        reservaStats: reservaStats || undefined
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard DOCENTE:', error);
      throw error;
    }
  },

  // Dashboard ESTUDIANTE - Solo lectura
  async obtenerDatosDashboardEstudiante(): Promise<DashboardData> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finHoy = new Date();
      finHoy.setHours(23, 59, 59, 999);

      const promises = [
        reservationsApi.obtenerTodasLasReservas(),
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
      ];

      const results = await Promise.allSettled(promises);
      const [
        todasLasReservas,
        espaciosRes,
        espaciosStatsRes
      ] = results;

      const reservas = extractReservasFromPromise(todasLasReservas as PromiseSettledResult<ApiResponse<Reserva[]>>);
      const reservasHoyData = filtrarReservasHoy(reservas);
      const espacios = extractEspaciosFromPromise(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStatsFromPromise(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);

      const ahora = new Date();
      const { reservasHoyCount, reservasPendientes, reservasAprobadas, reservasCanceladas } = 
        calcularEstadisticasReservas(reservas, reservasHoyData);
      const proximasReservas = obtenerProximasReservas(reservas, ahora);
      const { espaciosDisponibles, espaciosOcupados, espaciosEnMantenimiento } =
        calcularEstadisticasEspacios(espacios);

      // Calcular promedio de reservas aprobadas por espacio (como ratio, no porcentaje)
      const promedioReservasPorEspacio = espacios.length > 0
        ? parseFloat((reservasAprobadas / espacios.length).toFixed(1))
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
        totalUsuarios: 0,
        usuariosActivos: 0,
        usuariosNuevosHoy: 0,
        promedioReservasPorEspacio
      };

      return {
        stats,
        proximasReservas,
        reservasHoy: reservasHoyData,
        espacios
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
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finHoy = new Date();
      finHoy.setHours(23, 59, 59, 999);

      const promises = [
        reservationsApi.obtenerTodasLasReservas(), // Ya filtra por reservas públicas para externos
        reservationsApi.obtenerMisReservas().catch(() => null), // Sus propias solicitudes
        espaciosApi.obtenerEspacios(),
        apiRequest<EspacioStats>('/espacios/stats', { method: 'GET' }),
      ];

      const results = await Promise.allSettled(promises);
      const [
        todasLasReservas,
        misReservasRes,
        espaciosRes,
        espaciosStatsRes
      ] = results;

      // Reservas públicas (ya filtradas por el backend para usuarios externos)
      const reservasPublicas = extractReservasFromPromise(todasLasReservas as PromiseSettledResult<ApiResponse<Reserva[]>>);
      // Sus propias reservas (solicitudes)
      const misReservas: Reserva[] = misReservasRes?.status === 'fulfilled' && misReservasRes.value && 'data' in misReservasRes.value && Array.isArray(misReservasRes.value.data)
        ? (misReservasRes.value.data as Reserva[])
        : [];
      
      const reservasHoyData = filtrarReservasHoy(reservasPublicas);
      const espacios = extractEspaciosFromPromise(espaciosRes as PromiseSettledResult<ApiResponse<Espacio[]>>);
      const espaciosStats = extractEspacioStatsFromPromise(espaciosStatsRes as PromiseSettledResult<ApiResponse<EspacioStats>>);

      const ahora = new Date();
      // Estadísticas solo de reservas públicas
      const { reservasHoyCount, reservasAprobadas, reservasCanceladas } = 
        calcularEstadisticasReservas(reservasPublicas, reservasHoyData);
      // Próximas reservas públicas
      const proximasReservas = obtenerProximasReservas(reservasPublicas, ahora);
      const { espaciosDisponibles, espaciosOcupados, espaciosEnMantenimiento } =
        calcularEstadisticasEspacios(espacios);

      // Calcular promedio de reservas aprobadas por espacio (como ratio, no porcentaje)
      const promedioReservasPorEspacio = espacios.length > 0
        ? parseFloat((reservasAprobadas / espacios.length).toFixed(1))
        : 0;

      const misReservasPendientes = misReservas.filter((r: Reserva) => r.estado === 'PENDIENTE').length;

      // Estadísticas solo de reservas públicas
      const stats: DashboardStats = {
        totalReservas: reservasPublicas.length, // Total de reservas públicas
        reservasHoy: reservasHoyCount, // Reservas públicas de hoy
        reservasPendientes: misReservasPendientes, // Sus propias solicitudes pendientes
        reservasAprobadas, // Reservas públicas aprobadas
        reservasCanceladas, // Reservas públicas canceladas
        totalEspacios: espaciosStats.totalEspacios || espacios.length,
        espaciosDisponibles,
        espaciosOcupados,
        espaciosEnMantenimiento,
        capacidadPromedio: espaciosStats.capacidadPromedio || 0,
        totalUsuarios: 0,
        usuariosActivos: 0,
        usuariosNuevosHoy: 0,
        promedioReservasPorEspacio
      };

      return {
        stats,
        proximasReservas, // Próximas reservas públicas
        reservasHoy: reservasHoyData, // Reservas públicas de hoy
        espacios
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard EXTERNO:', error);
      throw error;
    }
  }
};

