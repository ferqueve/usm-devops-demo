/** Helpers de formato de fecha/hora/texto, en es-UY. */

const LOCALE = 'es-UY';

export function formatHora(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatFechaCorta(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' });
}

export function formatFechaLarga(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Duración entre dos ISO en formato compacto (ej. "1.5 h", "30 min"). */
export function formatDuracion(inicio: string, fin: string): string {
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = min / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
}

/** Iniciales a partir de un nombre (máx 2). */
export function getIniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Etiqueta legible de un rol. */
export function rolLabel(rol: string): string {
  return rol.charAt(0) + rol.slice(1).toLowerCase();
}
