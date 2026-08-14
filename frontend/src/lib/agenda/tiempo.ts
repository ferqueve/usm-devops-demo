import { useEffect, useState } from 'react';

/**
 * Helpers de tiempo para agendables (tutorías y eventos). Viven acá y no en la
 * carpeta de eventos porque los componentes de tutorías ya los estaban importando
 * desde ahí.
 *
 * Cuando no hay fin declarado se asume una duración de DURACION_POR_DEFECTO_MS.
 */

const DURACION_POR_DEFECTO_MS = 2 * 3600_000;

/**
 * Texto relativo al inicio de un agendable, con granularidad de horas/minutos
 * (sin ticking; se calcula en cada render). Ej: "En vivo", "Empieza en 3 h",
 * "En 2 días", "Mañana", "Hace 5 días".
 */
export function relativoInicio(iso?: string, finIso?: string): string {
  if (!iso) return '';
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return '';
  const now = Date.now();
  const end = finIso ? new Date(finIso).getTime() : start + DURACION_POR_DEFECTO_MS;
  if (now >= start && now <= end) return 'En vivo';
  const diff = start - now;
  if (diff <= 0) {
    const past = now - start;
    const dias = Math.floor(past / 86400000);
    if (dias >= 1) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    const horas = Math.floor(past / 3600000);
    if (horas >= 1) return `Hace ${horas} h`;
    return 'Recién';
  }
  const dias = Math.floor(diff / 86400000);
  if (dias >= 1) return dias === 1 ? 'Mañana' : `En ${dias} días`;
  const horas = Math.floor(diff / 3600000);
  if (horas >= 1) return `Empieza en ${horas} h`;
  const min = Math.max(1, Math.floor(diff / 60000));
  return `Empieza en ${min} min`;
}

/** True si está en curso ahora mismo (inicio ≤ now ≤ fin). */
export function estaEnVivo(inicio?: string, fin?: string): boolean {
  if (!inicio) return false;
  const start = new Date(inicio).getTime();
  if (Number.isNaN(start)) return false;
  const now = Date.now();
  const end = fin ? new Date(fin).getTime() : start + DURACION_POR_DEFECTO_MS;
  return now >= start && now <= end;
}

export interface Countdown {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  pasado: boolean;
  total: number;
}

/** Hook de cuenta regresiva a una fecha objetivo, actualizado cada segundo. */
export function useCountdown(targetIso?: string | null): Countdown {
  const calc = (): Countdown => {
    const target = targetIso ? new Date(targetIso).getTime() : 0;
    const diff = target - Date.now();
    const pasado = diff <= 0;
    const total = Math.max(0, diff);
    return {
      dias: Math.floor(total / 86400000),
      horas: Math.floor((total % 86400000) / 3600000),
      minutos: Math.floor((total % 3600000) / 60000),
      segundos: Math.floor((total % 60000) / 1000),
      pasado,
      total,
    };
  };
  const [cd, setCd] = useState<Countdown>(calc);
  useEffect(() => {
    setCd(calc());
    const t = setInterval(() => setCd(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso]);
  return cd;
}
