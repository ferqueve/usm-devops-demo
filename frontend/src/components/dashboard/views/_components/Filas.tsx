import { Link } from 'react-router-dom';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookOpen, CalendarClock, MapPin, Users } from 'lucide-react';
import type {
  Actividad,
  EspacioBreve,
  EspacioPresion,
  EventoBreve,
  ItemAtencion,
  MateriaBreve,
  TutoriaBreve,
} from '@/lib/api/dashboard';

/**
 * Las filas de los bloques del dashboard. Todas comparten alto y ritmo para
 * que dos paneles lado a lado no queden desparejos.
 */
const FILA = 'flex items-center gap-3 py-2 text-sm';

function Fecha({ valor }: Readonly<{ valor: string }>) {
  const fecha = new Date(valor);
  return (
    <span className="w-[74px] shrink-0 text-xs leading-tight text-muted-foreground">
      <span className="block font-medium text-foreground">{format(fecha, 'HH:mm')}</span>
      {format(fecha, "d MMM", { locale: es })}
    </span>
  );
}

export function MateriaFila({ materia }: Readonly<{ materia: MateriaBreve }>) {
  return (
    <Link to={`/materias/${materia.id}`} className={`${FILA} -mx-2 rounded-sm px-2 hover:bg-muted/40`}>
      <BookOpen className="h-4 w-4 shrink-0 text-marca-azul-texto" />
      <span className="min-w-0 flex-1 truncate font-medium">{materia.nombre}</span>
      {materia.codigo && (
        <span className="hidden shrink-0 text-2xs text-muted-foreground sm:inline">{materia.codigo}</span>
      )}
      {materia.creditos != null && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{materia.creditos} cr.</span>
      )}
      {materia.inscriptos != null && (
        <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {materia.inscriptos}
        </span>
      )}
    </Link>
  );
}

export function TutoriaFila({ tutoria }: Readonly<{ tutoria: TutoriaBreve }>) {
  const libres = Math.max(0, tutoria.cupo - tutoria.agendados);
  return (
    <Link to={`/tutorias/${tutoria.id}`} className={`${FILA} -mx-2 rounded-sm px-2 hover:bg-muted/40`}>
      <Fecha valor={tutoria.inicio} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{tutoria.materiaNombre ?? 'Tutoría'}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {[tutoria.docenteNombre, tutoria.espacioNombre].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {tutoria.cupo > 0 ? `${libres} libres` : `${tutoria.agendados} anotados`}
      </span>
    </Link>
  );
}

export function EventoFila({ evento }: Readonly<{ evento: EventoBreve }>) {
  return (
    <Link to={`/eventos/${evento.id}`} className={`${FILA} -mx-2 rounded-sm px-2 hover:bg-muted/40`}>
      <Fecha valor={evento.inicio} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{evento.titulo}</span>
        {evento.espacioNombre && (
          <span className="block truncate text-xs text-muted-foreground">{evento.espacioNombre}</span>
        )}
      </span>
      {evento.inscrito ? (
        <span className="shrink-0 rounded-full bg-utec-green/15 px-2 py-0.5 text-2xs font-medium text-marca-verde-texto">
          Anotado
        </span>
      ) : (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {evento.inscriptos}
          {evento.cupo ? `/${evento.cupo}` : ''}
        </span>
      )}
    </Link>
  );
}

export function ItemFila({ item }: Readonly<{ item: ItemAtencion }>) {
  return (
    <Link to="/inventory" className={`${FILA} -mx-2 rounded-sm px-2 hover:bg-muted/40`}>
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${item.urgencia >= 80 ? 'bg-utec-red' : 'bg-utec-orange'}`}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.titulo}</span>
        {item.motivo && <span className="block truncate text-xs text-muted-foreground">{item.motivo}</span>}
      </span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{item.urgencia}%</span>
    </Link>
  );
}

export function EspacioFila({ espacio }: Readonly<{ espacio: EspacioBreve }>) {
  return (
    <Link to={`/rooms/${espacio.id}`} className={`${FILA} -mx-2 rounded-sm px-2 hover:bg-muted/40`}>
      <MapPin className="h-4 w-4 shrink-0 text-marca-naranja-texto" />
      <span className="min-w-0 flex-1 truncate font-medium">{espacio.nombre}</span>
      {espacio.edificio && (
        <span className="hidden shrink-0 truncate text-xs text-muted-foreground sm:inline">{espacio.edificio}</span>
      )}
      <span className="shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">
        {espacio.estado.toLowerCase()}
      </span>
    </Link>
  );
}

/** Cuántas solicitudes espera cada espacio, con una barra proporcional al mayor. */
export function PresionFila({ espacio, maximo }: Readonly<{ espacio: EspacioPresion; maximo: number }>) {
  const porcentaje = maximo > 0 ? Math.round((espacio.pendientes / maximo) * 100) : 0;
  return (
    <Link to="/reservations" className="-mx-2 block rounded-sm px-2 py-2 hover:bg-muted/40">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium">{espacio.nombre}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{espacio.pendientes}</span>
      </span>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-utec-blue" style={{ width: `${porcentaje}%` }} />
      </span>
    </Link>
  );
}

const ACCION_TEXTO: Record<string, string> = {
  CREATE: 'creó',
  UPDATE: 'modificó',
  DELETE: 'eliminó',
};

/**
 * Qué pasó, en castellano.
 *
 * La auditoría guarda el login como un CREATE sobre "Autenticacion", que leído
 * literal daba "Usuario Admin creó Autenticacion".
 */
function frase(accion?: string, entidad?: string): string {
  if (entidad === 'Autenticacion') {
    return accion === 'DELETE' ? 'cerró sesión' : 'inició sesión';
  }
  const verbo = ACCION_TEXTO[accion ?? ''] ?? accion?.toLowerCase() ?? 'tocó';
  return `${verbo} ${entidad ?? ''}`.trim();
}

export function ActividadFila({ actividad }: Readonly<{ actividad: Actividad }>) {
  return (
    <div className={FILA}>
      <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">
        <b className="font-medium">{actividad.usuario ?? 'Alguien'}</b>{' '}
        <span className="text-muted-foreground">{frase(actividad.accion, actividad.entidad)}</span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDistanceToNowStrict(new Date(actividad.cuando), { locale: es, addSuffix: true })}
      </span>
    </div>
  );
}
