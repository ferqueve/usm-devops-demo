import type { Reserva } from '@/lib/types/spaces';

import {
  ESTADO_RESERVA,
  bordeIzquierdo,
  bordeSuperior,
  estadoDe,
  solido,
  suave,
  tinta,
} from '@/components/common/estados';

/**
 * Cómo se pinta el estado de una reserva.
 *
 * Los colores salían de la paleta cruda de Tailwind —`bg-green-50`,
 * `text-amber-700`, `border-red-200`—, que es justo lo que las reglas
 * prohíben, y lo usaban la tabla y las fichas de reservas: las dos pantallas
 * donde más tiempo se pasa. Al lado, el mismo estado se pintaba con los
 * tokens de rol en el diálogo de detalle. Dos looks para lo mismo.
 *
 * Ahora sale de `components/common/estados`, igual que eventos, tutorías e
 * inventario. Los nombres de los campos quedan como estaban para no tocar a
 * quien ya los usaba.
 */
export function getEstadoConfig(estado: Reserva['estado']) {
  const e = estadoDe(ESTADO_RESERVA, estado);
  return {
    label: e.label,
    color: suave(e),
    iconColor: tinta(e),
    stripeColor: solido(e),
    borderColor: bordeIzquierdo(e),
    cornerBorderColor: bordeSuperior(e),
    icon: e.icon,
  };
}

/** «14:30». */
export function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** «18 set 2026». Decía `es-ES` mientras el resto de la aplicación usa `es-UY`. */
export function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
