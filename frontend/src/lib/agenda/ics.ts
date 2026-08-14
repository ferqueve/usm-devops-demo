import { finConDefault, type Agendable } from './types';

/** Convierte un ISO a formato ICS UTC (YYYYMMDDTHHMMSSZ). */
function toICSDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICS(text: string): string {
  return (text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Genera el contenido de un archivo .ics para cualquier agendable. */
export function buildICS(a: Agendable): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//USM UTEC//Agenda//ES',
    'BEGIN:VEVENT',
    `UID:${a.fuente}-${a.id}@usm-utec`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(a.inicio)}`,
    `DTEND:${toICSDate(finConDefault(a))}`,
    `SUMMARY:${escapeICS(a.titulo)}`,
    a.descripcion ? `DESCRIPTION:${escapeICS(a.descripcion)}` : '',
    a.lugar ? `LOCATION:${escapeICS(a.lugar)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

/** Descarga el .ics. */
export function downloadICS(a: Agendable): void {
  const blob = new Blob([buildICS(a)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${a.fuente}-${a.id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

/** URL para agregar a Google Calendar. */
export function googleCalUrl(a: Agendable): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: a.titulo,
    dates: `${toICSDate(a.inicio)}/${toICSDate(finConDefault(a))}`,
    details: a.descripcion ?? '',
    location: a.lugar ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
