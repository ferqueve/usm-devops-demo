import { apiRequest } from './client';
import type { Reserva, ReservaStats, InventoryStats } from '../types/spaces';
import type { UserStats } from '../types/users';

/**
 * Contadores de la tira superior del dashboard. Los calcula la base: aca no se
 * recorre ninguna lista para contar.
 */
export interface DashboardStats {
  totalReservas: number;
  reservasHoy: number;
  reservasPendientes: number;
  reservasAprobadas: number;
  reservasCanceladas: number;

  totalEspacios: number;
  espaciosDisponibles: number;
  espaciosOcupados: number;
  espaciosEnMantenimiento: number;
  capacidadPromedio: number;

  totalUsuarios: number;
  usuariosActivos: number;
  usuariosNuevosHoy: number;

  /** Razon, no porcentaje: aprobadas sobre espacios. */
  promedioReservasPorEspacio: number;
}

/**
 * Respuesta de /dashboard. El backend decide por el rol del usuario que campos
 * llena: los que su pantalla no muestra vienen vacios.
 */
export interface DashboardData {
  stats: DashboardStats;
  /** Las diez proximas aprobadas que el usuario puede ver. */
  proximasReservas: Reserva[];
  /** Las ultimas del usuario, para los roles que reservan. */
  misReservas: Reserva[];
  /** Cola por aprobar, para los roles que aprueban. */
  reservasPendientes: Reserva[];
  reservaStats?: ReservaStats;
  userStats?: UserStats;
  inventarioStats?: InventoryStats;
  solicitudesInventarioPendientes: number;
}

/** Lo que muestra el panel de mantenimiento sobre el parque de espacios. */
export interface EspaciosResumen {
  totalEspacios: number;
  disponibles: number;
  enMantenimiento: number;
  ocupados: number;
}

const VACIO: DashboardData = {
  stats: {
    totalReservas: 0, reservasHoy: 0, reservasPendientes: 0, reservasAprobadas: 0, reservasCanceladas: 0,
    totalEspacios: 0, espaciosDisponibles: 0, espaciosOcupados: 0, espaciosEnMantenimiento: 0, capacidadPromedio: 0,
    totalUsuarios: 0, usuariosActivos: 0, usuariosNuevosHoy: 0, promedioReservasPorEspacio: 0,
  },
  proximasReservas: [],
  misReservas: [],
  reservasPendientes: [],
  solicitudesInventarioPendientes: 0,
};

export const dashboardApi = {
  /**
   * Todo el dashboard en una sola llamada.
   *
   * Antes eran doce en paralelo contra un pool de diez conexiones, y varias
   * descargaban listas enteras -- todos los espacios, todas las reservas del
   * mes -- para terminar mostrando un contador.
   */
  async obtenerDatosDashboard(): Promise<DashboardData> {
    const res = await apiRequest<DashboardData>('/dashboard', { method: 'GET' });
    return res.data ?? VACIO;
  },
};

/** Deriva el resumen de espacios que muestra mantenimiento. */
export function resumenEspacios(stats: DashboardStats | undefined): EspaciosResumen | null {
  if (!stats) return null;
  return {
    totalEspacios: stats.totalEspacios,
    disponibles: stats.espaciosDisponibles,
    enMantenimiento: stats.espaciosEnMantenimiento,
    ocupados: stats.espaciosOcupados,
  };
}

