import { useEffect, useState } from 'react';
import type { Evento } from '@/lib/types/eventos';

/** Convierte un ISO a formato ICS UTC (YYYYMMDDTHHMMSSZ). */
function toICSDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICS(text: string): string {
  return (text ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Genera el contenido de un archivo .ics para el evento. */
export function buildICS(evento: Evento): string {
  const fin = evento.fin ?? new Date(new Date(evento.inicio).getTime() + 2 * 3600_000).toISOString();
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//USM UTEC//Eventos//ES',
    'BEGIN:VEVENT',
    `UID:evento-${evento.id}@usm-utec`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(evento.inicio)}`,
    `DTEND:${toICSDate(fin)}`,
    `SUMMARY:${escapeICS(evento.titulo)}`,
    evento.descripcion ? `DESCRIPTION:${escapeICS(evento.descripcion)}` : '',
    evento.espacioNombre ? `LOCATION:${escapeICS(evento.espacioNombre)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

/** Descarga el .ics del evento. */
export function downloadICS(evento: Evento): void {
  const blob = new Blob([buildICS(evento)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `evento-${evento.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/** URL para agregar a Google Calendar. */
export function googleCalUrl(evento: Evento): string {
  const fin = evento.fin ?? new Date(new Date(evento.inicio).getTime() + 2 * 3600_000).toISOString();
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evento.titulo,
    dates: `${toICSDate(evento.inicio)}/${toICSDate(fin)}`,
    details: evento.descripcion ?? '',
    location: evento.espacioNombre ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Texto relativo al inicio de un evento, con granularidad de horas/minutos
 * (sin ticking; se calcula en cada render). Ej: "En vivo", "Empieza en 3 h",
 * "En 2 días", "Mañana", "Hace 5 días".
 */
export function relativoInicio(iso?: string, finIso?: string): string {
  if (!iso) return '';
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return '';
  const now = Date.now();
  const end = finIso ? new Date(finIso).getTime() : start + 2 * 3600_000;
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

/** True si el evento está en curso ahora mismo (inicio ≤ now ≤ fin). */
export function estaEnVivo(inicio?: string, fin?: string): boolean {
  if (!inicio) return false;
  const start = new Date(inicio).getTime();
  if (Number.isNaN(start)) return false;
  const now = Date.now();
  const end = fin ? new Date(fin).getTime() : start + 2 * 3600_000;
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
