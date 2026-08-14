import type { Evento } from '@/lib/types/eventos';
import type { Tutoria } from '@/lib/types/tutorias';

/**
 * Vista común de una tutoría o un evento como "algo agendable": pasa en un rango
 * horario, en un lugar, y se puede llevar al calendario personal.
 *
 * Tutoría y evento son entidades distintas con reglas distintas — la tutoría cuelga
 * de una materia, el evento es suelto — pero comparten esta forma, y todo lo que sólo
 * necesite esta forma (el calendario mensual, el .ics, el link a Google Calendar) se
 * escribe una sola vez contra este tipo en vez de duplicarse por entidad.
 */
export interface Agendable {
  id: number;
  /** Discrimina el origen: define el prefijo del UID del .ics y a dónde navega. */
  fuente: 'tutoria' | 'evento';
  titulo: string;
  inicio: string;
  /** Puede faltar en eventos; quien lo consuma decide el default. */
  fin?: string | null;
  lugar?: string | null;
  descripcion?: string | null;
  /** Estado crudo de la entidad, para colorear el chip. */
  estado: string;
  /** Ruta del detalle en la app. */
  href: string;
}

/** Duración asumida cuando un evento no declara fin. */
const DURACION_POR_DEFECTO_MS = 2 * 3600_000;

export function finConDefault(a: Agendable): string {
  if (a.fin) return a.fin;
  return new Date(new Date(a.inicio).getTime() + DURACION_POR_DEFECTO_MS).toISOString();
}

export function tutoriaToAgendable(t: Tutoria): Agendable {
  const esVirtual = t.modalidad === 'VIRTUAL';
  const descripcion = [
    `Docente: ${t.docenteNombre}`,
    esVirtual && t.enlace ? `Enlace: ${t.enlace}` : '',
  ].filter(Boolean).join('\n');

  return {
    id: t.id,
    fuente: 'tutoria',
    titulo: `Tutoría · ${t.materiaNombre}`,
    inicio: t.inicio,
    fin: t.fin,
    lugar: esVirtual ? (t.enlace ?? 'Virtual') : (t.espacioNombre ?? null),
    descripcion,
    estado: t.estado,
    href: `/tutorias/${t.id}`,
  };
}

export function eventoToAgendable(e: Evento): Agendable {
  return {
    id: e.id,
    fuente: 'evento',
    titulo: e.titulo,
    inicio: e.inicio,
    fin: e.fin ?? null,
    lugar: e.espacioNombre ?? null,
    descripcion: e.descripcion ?? null,
    estado: e.estado,
    href: `/eventos/${e.id}`,
  };
}
