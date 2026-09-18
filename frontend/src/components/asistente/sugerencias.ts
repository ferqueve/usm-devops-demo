import {
  BarChart3, CalendarClock, DoorOpen, ListChecks, Projector, Wrench, type LucideIcon,
} from 'lucide-react';
import { ROLES } from '@/lib/config/constants';
import type { UtecBg } from '@/components/dashboard/views/_components/StatStrip';

export interface Sugerencia {
  titulo: string;
  prompt: string;
  icon: LucideIcon;
  /** Fondo institucional, igual que las tarjetas del dashboard. */
  bg: UtecBg;
}

const MIS_RESERVAS: Sugerencia = {
  titulo: 'Mis próximas reservas',
  prompt: '¿Qué reservas tengo la próxima semana?',
  icon: CalendarClock,
  bg: 'blue',
};

const LIBRES: Sugerencia = {
  titulo: 'Salas libres',
  prompt: '¿Qué salones hay libres mañana de 18 a 20?',
  icon: DoorOpen,
  bg: 'cyan',
};

const PROYECTOR: Sugerencia = {
  titulo: 'Encontrar un espacio',
  prompt: 'Necesito un salón con proyector para 30 personas',
  icon: Projector,
  bg: 'dark',
};

const GESTION: Sugerencia[] = [
  {
    titulo: 'Pendientes de aprobar',
    prompt: '¿Cuántas reservas pendientes hay hoy?',
    icon: ListChecks,
    bg: 'yellow',
  },
  {
    titulo: 'Uso del último mes',
    prompt: 'Resumí la ocupación de los últimos 30 días',
    icon: BarChart3,
    bg: 'green',
  },
  {
    titulo: 'Equipos en mantenimiento',
    prompt: '¿Qué equipos están en mantenimiento?',
    icon: Wrench,
    bg: 'red',
  },
];

/** Preguntas de arranque según lo que cada rol puede consultar. */
export function sugerenciasPara(rol: string | undefined): Sugerencia[] {
  if (rol === ROLES.ADMIN || rol === ROLES.ANALISTA) {
    // Mismo orden de colores que la tira del dashboard.
    return [GESTION[0], MIS_RESERVAS, GESTION[1], LIBRES, GESTION[2], PROYECTOR];
  }
  if (rol === ROLES.MANTENIMIENTO) {
    return [GESTION[2], LIBRES, MIS_RESERVAS];
  }
  return [MIS_RESERVAS, LIBRES, PROYECTOR];
}
