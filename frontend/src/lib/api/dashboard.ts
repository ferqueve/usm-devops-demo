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

  /** Materias que el usuario dicta o cursa, y los créditos que suman. */
  materias: number;
  creditos: number;
  /** Inscriptos en las materias que dicta. */
  inscriptos: number;
  /** Franjas de tutoría propias y clases seguidas asistidas. */
  tutorias: number;
  racha: number;
  /** Tutorías a las que el estudiante ya asistió. */
  tutoriasAsistidas: number;
  /** Solicitudes que este analista ya resolvió. */
  resueltasPorMi: number;
  eventosProximos: number;
}

export interface MateriaBreve {
  id: number;
  nombre: string;
  codigo?: string;
  creditos?: number;
  inscriptos?: number;
  docenteNombre?: string;
  semestre?: number;
}

export interface TutoriaBreve {
  id: number;
  materiaId?: number;
  materiaNombre?: string;
  inicio: string;
  fin: string;
  espacioNombre?: string;
  docenteNombre?: string;
  agendados: number;
  cupo: number;
}

export interface EventoBreve {
  id: number;
  titulo: string;
  inicio: string;
  espacioNombre?: string;
  inscriptos: number;
  cupo?: number;
  inscrito: boolean;
}

export interface ItemAtencion {
  id: number;
  titulo: string;
  motivo?: string;
  urgencia: number;
}

export interface EspacioBreve {
  id: number;
  nombre: string;
  estado: string;
  edificio?: string;
}

export interface Actividad {
  cuando: string;
  usuario?: string;
  accion?: string;
  entidad?: string;
}

export interface Salud {
  estado: string;
  componentes: number;
  caidos: string[];
}

export interface Sostenibilidad {
  hojasEvitadas: number;
  arbolesSalvados: number;
  co2EvitadoKg: number;
}

export interface Serie {
  nombre: string;
  valor: number;
}

export interface EspacioPresion {
  id: number;
  nombre: string;
  pendientes: number;
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

  /** Materias que dicta (DOCENTE) o que cursa (ESTUDIANTE). */
  misMaterias: MateriaBreve[];
  /** Tutorías que dicta (DOCENTE) o que tiene agendadas (ESTUDIANTE). */
  misTutorias: TutoriaBreve[];
  eventos: EventoBreve[];
  /** Ítems que piden reparación (MANTENIMIENTO). */
  inventarioAtencion: ItemAtencion[];
  espaciosFueraDeServicio: EspacioBreve[];
  /** Últimos movimientos del sistema (ADMIN). */
  actividadReciente: Actividad[];
  salud?: Salud;
  sostenibilidad?: Sostenibilidad;
  /** Espacios con más solicitudes esperando (ANALISTA y ADMIN). */
  espaciosConPresion: EspacioPresion[];
  /** Para graficar, calculados sobre todas sus materias y no sobre las listadas. */
  creditosPorSemestre: Serie[];
  inscriptosPorMateria: Serie[];
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
    materias: 0, creditos: 0, inscriptos: 0, tutorias: 0, racha: 0, tutoriasAsistidas: 0, resueltasPorMi: 0, eventosProximos: 0,
  },
  proximasReservas: [],
  misReservas: [],
  reservasPendientes: [],
  solicitudesInventarioPendientes: 0,
  misMaterias: [],
  misTutorias: [],
  eventos: [],
  inventarioAtencion: [],
  espaciosFueraDeServicio: [],
  actividadReciente: [],
  espaciosConPresion: [],
  creditosPorSemestre: [],
  inscriptosPorMateria: [],
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

