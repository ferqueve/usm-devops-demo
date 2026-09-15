import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, CircleHelp, TriangleAlert, UserX, UsersRound } from 'lucide-react';
import type { RiesgoTutoria } from '@/lib/api/stats';
import type { TemaGraficos } from '@/components/statistics/graficos/tema';

export interface EstiloTutoria {
  etiqueta: string;
  icono: LucideIcon;
  color: string;
}

/** Orden en que se listan los riesgos en filtros y leyendas: de lo que más pide acción a lo que menos. */
export const ORDEN_RIESGO: RiesgoTutoria[] = ['vacia', 'baja', 'alta', 'normal', 'sin_prediccion'];

/**
 * Colores de estado de una tutoría, siempre con ícono y texto. "Se llena" va en
 * azul y no en rojo: que venga mucha gente no es malo, pide otra cosa (un
 * espacio más grande, otra franja).
 */
export function estiloTutoria(riesgo: RiesgoTutoria, tema: TemaGraficos): EstiloTutoria {
  switch (riesgo) {
    case 'vacia':
      return { etiqueta: 'Casi vacía', icono: UserX, color: tema.danado };
    case 'baja':
      return { etiqueta: 'Asistencia baja', icono: TriangleAlert, color: tema.mantenimiento };
    case 'alta':
      return { etiqueta: 'Se llena', icono: UsersRound, color: tema.categorias[0] };
    case 'normal':
      return { etiqueta: 'Normal', icono: CheckCircle2, color: tema.disponible };
    default:
      return { etiqueta: 'Sin predicción', icono: CircleHelp, color: tema.vencidas };
  }
}

/** Color de la probabilidad de asistir de un estudiante, con los mismos cortes que el riesgo. */
export function colorProbabilidad(p: number | null, tema: TemaGraficos): string {
  if (p == null) return tema.vencidas;
  if (p < 0.35) return tema.danado;
  if (p < 0.5) return tema.mantenimiento;
  return tema.disponible;
}

/** Si el modelo todavía no le gana a predecir el promedio: AUC bajo o Brier sin mejora. */
export function modeloFlojo(auc: number | null | undefined, brier: number | null | undefined, brierBase: number | null | undefined): boolean {
  return (auc != null && auc < 0.6) || (brier != null && brierBase != null && brier >= brierBase);
}
