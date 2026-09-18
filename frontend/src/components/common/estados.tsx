import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  Hourglass,
  Lock,
  Wrench,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';

/**
 * Cómo se ve cada estado del dominio.
 *
 * Había nueve mapas repartidos por los componentes, y varios eran idénticos
 * palabra por palabra: el de eventos estaba dos veces —`EventoDetail` y
 * `EventoCardDescubrir`— y el de tutorías otras dos —`TutoriaDetail` y
 * `MateriaDetail`—. Los demás decían lo mismo en otra forma: la agenda
 * necesitaba un relleno y el listado de tutorías un borde a la izquierda, así
 * que cada uno escribía sus propias clases y podían quedar en colores
 * distintos.
 *
 * Por eso acá se declara el **tono**, no la clase. La forma —relleno, borde,
 * pastilla— se deriva, y un estado no puede terminar verde en una pantalla y
 * gris en otra.
 *
 * El color de un estado sí significa algo, a diferencia del de una carrera o
 * una métrica. Es la excepción a la regla de la paleta.
 */

type Tono = 'verde' | 'amarillo' | 'rojo' | 'naranja' | 'azul' | 'oscuro';

export interface Estado {
  label: string;
  tono: Tono;
  icon: LucideIcon;
}

/** Relleno macizo con la tinta que se lee encima, medida. */
const RELLENO: Record<Tono, string> = {
  verde: 'bg-utec-green text-marca-tinta border-utec-green',
  amarillo: 'bg-utec-yellow text-marca-tinta border-utec-yellow',
  naranja: 'bg-utec-orange text-marca-tinta border-utec-orange',
  rojo: 'bg-utec-red text-white border-utec-red',
  azul: 'bg-utec-blue text-white border-utec-blue',
  oscuro: 'bg-chrome text-white border-utec-dark',
};

/**
 * La versión tenue: fondo teñido, texto del mismo tono y borde.
 *
 * Es la que va en una pastilla dentro de una tabla, donde un relleno macizo
 * por fila sería demasiado. El texto usa la familia `marca-*-texto`, que sí
 * cambia con el tema; el tinte no hace falta que cambie porque va sobre la
 * tarjeta.
 */
const SUAVE: Record<Tono, string> = {
  verde: 'bg-utec-green/15 text-marca-verde-texto border-utec-green/30',
  amarillo: 'bg-utec-yellow/15 text-marca-amarillo-texto border-utec-yellow/30',
  naranja: 'bg-utec-orange/15 text-marca-naranja-texto border-utec-orange/30',
  rojo: 'bg-utec-red/15 text-marca-rojo-texto border-utec-red/30',
  azul: 'bg-utec-blue/15 text-marca-azul-texto border-utec-blue/30',
  oscuro: 'bg-muted text-muted-foreground border-border',
};

/** Sólo el color, para un icono o una raya. */
const SOLIDO: Record<Tono, string> = {
  verde: 'bg-utec-green',
  amarillo: 'bg-utec-yellow',
  naranja: 'bg-utec-orange',
  rojo: 'bg-utec-red',
  azul: 'bg-utec-blue',
  oscuro: 'bg-chrome',
};

const BORDE_SUPERIOR: Record<Tono, string> = {
  verde: 'border-t-utec-green',
  amarillo: 'border-t-utec-yellow',
  naranja: 'border-t-utec-orange',
  rojo: 'border-t-utec-red',
  azul: 'border-t-utec-blue',
  oscuro: 'border-t-utec-dark',
};

const TINTA: Record<Tono, string> = {
  verde: 'text-marca-verde-texto',
  amarillo: 'text-marca-amarillo-texto',
  naranja: 'text-marca-naranja-texto',
  rojo: 'text-marca-rojo-texto',
  azul: 'text-marca-azul-texto',
  oscuro: 'text-muted-foreground',
};

/** Una raya al costado, para filas de lista. */
const BORDE_IZQUIERDO: Record<Tono, string> = {
  verde: 'border-l-utec-green',
  amarillo: 'border-l-utec-yellow',
  naranja: 'border-l-utec-orange',
  rojo: 'border-l-utec-red',
  azul: 'border-l-utec-blue',
  oscuro: 'border-l-utec-dark',
};

const DESCONOCIDO: Estado = { label: '', tono: 'oscuro', icon: AlertCircle };

export const ESTADO_EVENTO: Record<string, Estado> = {
  PUBLICADO: { label: 'Publicado', tono: 'verde', icon: CheckCircle },
  BORRADOR: { label: 'Borrador', tono: 'amarillo', icon: FileText },
  FINALIZADO: { label: 'Finalizado', tono: 'oscuro', icon: Clock },
  CANCELADO: { label: 'Cancelado', tono: 'rojo', icon: XCircle },
};

export const ESTADO_TUTORIA: Record<string, Estado> = {
  ABIERTA: { label: 'Abierta', tono: 'verde', icon: CheckCircle },
  CERRADA: { label: 'Cerrada', tono: 'oscuro', icon: Lock },
  CANCELADA: { label: 'Cancelada', tono: 'rojo', icon: XCircle },
};

export const ESTADO_RESERVA: Record<string, Estado> = {
  APROBADO: { label: 'Aprobada', tono: 'verde', icon: CheckCircle2 },
  PENDIENTE: { label: 'Pendiente', tono: 'amarillo', icon: Hourglass },
  CANCELADO: { label: 'Cancelada', tono: 'rojo', icon: XCircle },
  RECHAZADO: { label: 'Rechazada', tono: 'rojo', icon: XCircle },
};

/**
 * El estado de un espacio. Ojo que no es el mismo que el de un item: un
 * espacio puede estar NO_DISPONIBLE y un item DANADO, y estaban compartiendo
 * el mismo mapa, así que un espacio no disponible mostraba la clave cruda.
 */
export const ESTADO_ESPACIO: Record<string, Estado> = {
  DISPONIBLE: { label: 'Disponible', tono: 'verde', icon: CheckCircle },
  MANTENIMIENTO: { label: 'En mantenimiento', tono: 'amarillo', icon: Wrench },
  NO_DISPONIBLE: { label: 'No disponible', tono: 'rojo', icon: XCircle },
};

export const ESTADO_INVENTARIO: Record<string, Estado> = {
  DISPONIBLE: { label: 'Disponible', tono: 'verde', icon: CheckCircle },
  MANTENIMIENTO: { label: 'Mantenimiento', tono: 'amarillo', icon: Wrench },
  DANADO: { label: 'Dañado', tono: 'rojo', icon: AlertCircle },
};

/** Todos juntos, para las vistas que mezclan dominios: la agenda. */
export const ESTADO: Record<string, Estado> = {
  ...ESTADO_EVENTO,
  ...ESTADO_TUTORIA,
  ...ESTADO_INVENTARIO,
  ...ESTADO_ESPACIO,
  ...ESTADO_RESERVA,
};

/** El estado, o uno que al menos muestra la clave cruda sin romper nada. */
export function estadoDe(mapa: Record<string, Estado>, clave: string): Estado {
  return mapa[clave] ?? { ...DESCONOCIDO, label: clave };
}

export const relleno = (e: Estado) => RELLENO[e.tono];
export const suave = (e: Estado) => SUAVE[e.tono];
export const solido = (e: Estado) => SOLIDO[e.tono];
export const tinta = (e: Estado) => TINTA[e.tono];
export const bordeIzquierdo = (e: Estado) => BORDE_IZQUIERDO[e.tono];
export const bordeSuperior = (e: Estado) => BORDE_SUPERIOR[e.tono];

/** La pastilla con icono. Es la forma en que se ve casi siempre. */
export function EstadoBadge({
  estado,
  className,
}: Readonly<{ estado: Estado; className?: string }>) {
  const Icon = estado.icon;
  return (
    <Badge className={`${relleno(estado)} border font-medium ${className ?? ''}`}>
      <Icon className="mr-1.5 size-3.5" />
      {estado.label}
    </Badge>
  );
}
