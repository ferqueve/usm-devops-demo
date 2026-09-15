import type { ResumenReservas } from '@/lib/api/stats';

type Granularidad = ResumenReservas['granularidad'];

export interface TramoSerie {
  periodo: string;
  aprobadas: number;
  pendientes: number;
  canceladas: number;
  /** Primer y último día del tramo que cae dentro del período. */
  desde: string;
  hasta: string;
  incompleto: boolean;
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function finDelTramo(periodo: string, granularidad: Granularidad): string {
  if (granularidad === 'dia') return periodo;
  if (granularidad === 'semana') return sumarDias(periodo, 6);
  const d = new Date(`${periodo}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

/**
 * Marca los tramos que el período corta: con "últimos 90 días" la primera
 * semana y la última tienen pocos días, y como barras enteras parecían caídas
 * de demanda que no existieron.
 */
export function marcarIncompletos(resumen: ResumenReservas): TramoSerie[] {
  return resumen.serie.map((p) => {
    const fin = finDelTramo(p.periodo, resumen.granularidad);
    const desde = p.periodo < resumen.desde ? resumen.desde : p.periodo;
    const hasta = fin > resumen.hasta ? resumen.hasta : fin;
    return { ...p, desde, hasta, incompleto: desde !== p.periodo || hasta !== fin };
  });
}

