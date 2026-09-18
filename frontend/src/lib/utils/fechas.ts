/**
 * Cómo se escribe una fecha en la interfaz.
 *
 * Había catorce copias de esto repartidas por los componentes —`formatFecha`
 * ×4, `fmt` ×5, `relativo` ×3, `fmtFecha` ×2, más dos `fechaCorta`—, y
 * divergían en cosas que se ven:
 *
 *   - sin fecha, tres devolvían «—» y una cadena vacía;
 *   - dos ponían el día de la semana y dos no;
 *   - una decía «En 3 días» y otra «en 3 días».
 *
 * O sea que la misma fecha se leía distinto según la pantalla.
 *
 * Todo pasa por `es-UY`. Lo que viene como `YYYY-MM-DD` —un día, sin hora— se
 * lee en UTC a propósito: interpretarlo en la zona local lo corre un día para
 * atrás al oeste de Greenwich.
 */

/**
 * Los días, en los dos órdenes que hacen falta.
 *
 * Estaban escritos seis veces, tres empezando en lunes y tres en domingo. No
 * era un bug —los de lunes convierten con `(getDay() + 6) % 7`— pero tener las
 * dos versiones sueltas es pedir uno.
 *
 * `DIAS_DESDE_DOMINGO` es el que se indexa directo con `Date.getDay()`.
 * `DIAS_DESDE_LUNES` es el que se muestra, porque la semana del campus
 * arranca el lunes.
 */
export const DIAS_DESDE_DOMINGO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
export const DIAS_DESDE_LUNES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

/** El índice de `Date.getDay()` pasado a semana que arranca el lunes. */
export const indiceDesdeLunes = (fecha: Date) => (fecha.getDay() + 6) % 7;

/** Lo que se muestra cuando no hay fecha. Un guion largo, no un hueco. */
const SIN_FECHA = '—';

function aFecha(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  // «2026-09-18» es un día, no un instante: se ancla a UTC.
  const soloDia = /^\d{4}-\d{2}-\d{2}$/.test(iso.slice(0, 10)) && iso.length <= 10;
  const d = new Date(soloDia ? `${iso.slice(0, 10)}T00:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** «18 set 2026, 14:30». Con `diaSemana`, «vie 18 set 2026, 14:30». */
export function fechaHora(
  iso: string | null | undefined,
  { diaSemana = false, vacio = SIN_FECHA }: { diaSemana?: boolean; vacio?: string } = {}
): string {
  const d = aFecha(iso);
  if (!d) return vacio;
  return d.toLocaleString('es-UY', {
    ...(diaSemana ? { weekday: 'short' as const } : {}),
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * «viernes 18 set, 14:30». Sin año, con el día de la semana entero.
 *
 * Es el de los encabezados que hablan de algo próximo: ahí el año sobra y el
 * día de la semana es justo lo que se quiere leer.
 */
export function fechaHoraLarga(iso: string | null | undefined, vacio = SIN_FECHA): string {
  const d = aFecha(iso);
  if (!d) return vacio;
  return d.toLocaleString('es-UY', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Corre una fecha «YYYY-MM-DD» N días, y devuelve otra «YYYY-MM-DD».
 *
 * Todo en UTC: sumar días en hora local se rompe el día del cambio de
 * horario, que dura 23 o 25 horas.
 */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** «18 set». Para ejes de gráfico y listas apretadas. */
export function fechaCorta(iso: string | null | undefined, vacio = SIN_FECHA): string {
  const d = aFecha(iso?.slice(0, 10));
  if (!d) return vacio;
  return d
    .toLocaleDateString('es-UY', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .replace('.', '');
}

/** «viernes 18 de setiembre». */
export function fechaLarga(iso: string | null | undefined, vacio = SIN_FECHA): string {
  const d = aFecha(iso?.slice(0, 10));
  if (!d) return vacio;
  return d.toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

/** «18 set 2026», sin hora. */
export function soloFecha(iso: string | null | undefined, vacio = SIN_FECHA): string {
  const d = aFecha(iso);
  if (!d) return vacio;
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * «Hoy», «Mañana», «Ayer», «en 3 días», «hace 3 días».
 *
 * Mira días de calendario y no las 24 horas exactas: algo a las 23:00 de hoy
 * es «Hoy» aunque falten menos de 24 horas para mañana a las 22:00.
 */
export function relativa(iso: string | null | undefined, vacio = ''): string {
  const d = aFecha(iso);
  if (!d) return vacio;
  const dia = (x: Date) => Math.floor(new Date(x).setHours(0, 0, 0, 0) / 86400000);
  const dias = dia(d) - dia(new Date());
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  if (dias === -1) return 'Ayer';
  return dias > 1 ? `en ${dias} días` : `hace ${Math.abs(dias)} días`;
}
