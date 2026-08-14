import type { Tutoria } from '@/lib/types/tutorias';

function toICSDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
function escapeICS(text: string): string {
  return (text ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function titulo(t: Tutoria): string {
  return `Tutoría · ${t.materiaNombre}`;
}
function lugar(t: Tutoria): string {
  if (t.modalidad === 'VIRTUAL') return t.enlace ?? 'Virtual';
  return t.espacioNombre ?? '';
}
function descripcion(t: Tutoria): string {
  const partes = [`Docente: ${t.docenteNombre}`, t.modalidad === 'VIRTUAL' && t.enlace ? `Enlace: ${t.enlace}` : ''];
  return partes.filter(Boolean).join('\n');
}

export function buildICS(t: Tutoria): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//USM UTEC//Tutorias//ES',
    'BEGIN:VEVENT',
    `UID:tutoria-${t.id}@usm-utec`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(t.inicio)}`,
    `DTEND:${toICSDate(t.fin)}`,
    `SUMMARY:${escapeICS(titulo(t))}`,
    `DESCRIPTION:${escapeICS(descripcion(t))}`,
    lugar(t) ? `LOCATION:${escapeICS(lugar(t))}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function downloadICS(t: Tutoria): void {
  const blob = new Blob([buildICS(t)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tutoria-${t.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function googleCalUrl(t: Tutoria): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo(t),
    dates: `${toICSDate(t.inicio)}/${toICSDate(t.fin)}`,
    details: descripcion(t),
    location: lugar(t),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
