import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, CircleSlash, Siren, TriangleAlert, MinusCircle } from 'lucide-react';
import type { RiesgoInventario, TipoInventarioML } from '@/lib/api/stats';
import { mezclar, type TemaGraficos } from '@/components/statistics/graficos/tema';

export interface EstiloRiesgo {
  etiqueta: string;
  icono: LucideIcon;
  color: string;
}

/**
 * Colores de estado del semáforo, siempre con ícono y texto. "Sin stock" es
 * más grave que "alto" (no hay nada que prestar): va en un rojo más oscuro y
 * no en otro tono, para que se lea como el mismo eje.
 */
export function estiloRiesgo(riesgo: RiesgoInventario | null, tema: TemaGraficos): EstiloRiesgo {
  switch (riesgo) {
    case 'sin_stock':
      return { etiqueta: 'Sin stock', icono: CircleSlash, color: mezclar(tema.danado, '#000000', 0.3) };
    case 'alto':
      return { etiqueta: 'Riesgo alto', icono: Siren, color: tema.danado };
    case 'medio':
      return { etiqueta: 'Riesgo medio', icono: TriangleAlert, color: tema.mantenimiento };
    case 'bajo':
      return { etiqueta: 'Riesgo bajo', icono: CheckCircle2, color: tema.disponible };
    default:
      return { etiqueta: 'Sin modelo', icono: MinusCircle, color: tema.vencidas };
  }
}

/** Lo máximo ya pedido para un mismo día del horizonte. */
export function comprometidasMax(t: TipoInventarioML): number {
  return Math.max(0, ...t.serie.map((d) => d.comprometidas));
}

/** Variabilidad en palabras a partir del alpha de la binomial negativa. */
export function variabilidad(alpha: number | null): string {
  if (alpha == null) return '—';
  if (alpha >= 0.5) return 'alta';
  if (alpha >= 0.15) return 'media';
  return 'baja';
}
