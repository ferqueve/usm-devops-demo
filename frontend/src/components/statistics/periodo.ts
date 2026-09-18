import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type PeriodoId = '30d' | '90d' | '12m' | 'anio';

export interface Rango {
  desde: string;
  hasta: string;
}

export const PERIODOS: ReadonlyArray<{ id: PeriodoId; label: string; corto: string; minimo: string }> = [
  { id: '30d', label: 'Últimos 30 días', corto: '30 días', minimo: '30d' },
  { id: '90d', label: 'Últimos 90 días', corto: '90 días', minimo: '90d' },
  { id: '12m', label: 'Últimos 12 meses', corto: '12 meses', minimo: '12m' },
  { id: 'anio', label: 'Este año', corto: 'Este año', minimo: 'Año' },
];

const PERIODO_POR_DEFECTO: PeriodoId = '90d';

/**
 * "Hoy" en el campus, como YYYY-MM-DD.
 *
 * Antes cada vista hacía `new Date().toISOString().slice(0, 10)`, que es la
 * fecha en UTC: desde las 21:00 de Montevideo el período terminaba mañana.
 */
export function hoyEnElCampus(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Montevideo' }).format(ahora);
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function rangoDe(id: PeriodoId, hoy = hoyEnElCampus()): Rango {
  switch (id) {
    case '30d':
      return { desde: sumarDias(hoy, -29), hasta: hoy };
    case '90d':
      return { desde: sumarDias(hoy, -89), hasta: hoy };
    case '12m': {
      const d = new Date(`${hoy}T00:00:00Z`);
      d.setUTCFullYear(d.getUTCFullYear() - 1);
      return { desde: sumarDias(d.toISOString().slice(0, 10), 1), hasta: hoy };
    }
    case 'anio':
      return { desde: `${hoy.slice(0, 4)}-01-01`, hasta: hoy };
  }
}


/**
 * El período elegido vive en la URL (?periodo=90d): lo comparten Reservas e
 * Inventario, sobrevive a recargar y se puede pasar por link.
 */
export function usePeriodo() {
  const [params, setParams] = useSearchParams();
  const pedido = params.get('periodo') as PeriodoId | null;
  const id: PeriodoId = PERIODOS.some((p) => p.id === pedido) ? (pedido as PeriodoId) : PERIODO_POR_DEFECTO;

  const rango = useMemo(() => rangoDe(id), [id]);
  const periodo = PERIODOS.find((p) => p.id === id)!;

  const elegir = useCallback(
    (nuevo: PeriodoId) => {
      setParams(
        (prev) => {
          const siguiente = new URLSearchParams(prev);
          siguiente.set('periodo', nuevo);
          return siguiente;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { id, rango, periodo, elegir };
}

/* El formato de fecha vive en un solo lugar. Se reexporta para no tocar a
   quien ya las importaba de este módulo. */
export { fechaCorta } from '@/lib/utils/fechas';
