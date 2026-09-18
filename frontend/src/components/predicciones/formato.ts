/**
 * Formatos de las tres vistas de Predicciones. Las fechas "YYYY-MM-DD" vienen
 * ya agrupadas en la hora de Montevideo, así que se muestran en UTC para que
 * el navegador no las corra un día; los instantes (inicio de una tutoría) sí
 * se pasan a la hora del campus.
 */

const ZONA_CAMPUS = 'America/Montevideo';



/** "mar 16 sep". */
export function fechaConDia(fecha: string): string {
  return new Date(`${fecha.slice(0, 10)}T00:00:00Z`)
    .toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .replaceAll('.', '')
    .replace(',', '');
}

/** "mar 15 set" → "Mar 15 set". `capitalize` de CSS ponía en mayúscula también el mes. */
export function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Partes de un instante en la hora del campus, para armar la ficha de fecha de una tutoría. */
export function partesInstante(iso: string): { dia: string; numero: string; mes: string; hora: string; fecha: string } {
  const d = new Date(iso);
  const parte = (op: Intl.DateTimeFormatOptions) => d.toLocaleString('es-UY', { ...op, timeZone: ZONA_CAMPUS }).replace('.', '');
  return {
    dia: parte({ weekday: 'short' }),
    numero: parte({ day: 'numeric' }),
    mes: parte({ month: 'short' }),
    hora: parte({ hour: '2-digit', minute: '2-digit', hour12: false }),
    fecha: d.toLocaleDateString('en-CA', { timeZone: ZONA_CAMPUS }),
  };
}

export function fechaHora(iso: string): string {
  const p = partesInstante(iso);
  return `${p.dia} ${p.numero} ${p.mes} · ${p.hora}`;
}

export function entero(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return '—';
  return Math.round(valor).toLocaleString('es-UY');
}

export function decimal(valor: number | null | undefined, digitos = 1): string {
  if (valor == null || !Number.isFinite(valor)) return '—';
  return valor.toLocaleString('es-UY', { minimumFractionDigits: digitos, maximumFractionDigits: digitos });
}

/** Una proporción de 0 a 1 como porcentaje entero. */
export function porcentaje01(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return '—';
  return `${Math.round(valor * 100)}%`;
}

/** "+12%", "−4%" o "0%": el signo va siempre, para que no se lea como un valor absoluto. */
export function cambio(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return '—';
  const r = Math.round(valor);
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r)}%`;
}

/** 0 = lunes. `getUTCDay` arranca en domingo. */
export function diaSemana(fecha: string): number {
  return (new Date(`${fecha.slice(0, 10)}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana de una fecha. */
export function lunes(fecha: string): string {
  return sumarDias(fecha, -diaSemana(fecha));
}

/** Clase para los gráficos de recharts: index.css achica todos los svg a 14px (es para íconos). */
export const SVG_LLENO = '[&_svg.recharts-surface]:!h-full [&_svg.recharts-surface]:!w-full';

/* El formato de fecha vive en un solo lugar. Se reexporta para no tocar a
   quien ya las importaba de este módulo. */
export { fechaCorta, fechaLarga } from '@/lib/utils/fechas';
