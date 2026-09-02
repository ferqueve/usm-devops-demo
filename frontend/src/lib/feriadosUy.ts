// Feriados de Uruguay (laicos + comunes). Para el aviso "ojo, es feriado" — no es legal.
// Fijos por MM-DD; movibles cargados puntualmente por año (AAAA-MM-DD).

const FIJOS: Record<string, string> = {
  '01-01': 'Año Nuevo',
  '01-06': 'Día de Reyes',
  '04-19': 'Desembarco de los 33 Orientales',
  '05-01': 'Día de los Trabajadores',
  '05-18': 'Batalla de Las Piedras',
  '06-19': 'Natalicio de Artigas',
  '07-18': 'Jura de la Constitución',
  '08-25': 'Declaratoria de la Independencia',
  '10-12': 'Día de la Diversidad Cultural',
  '11-02': 'Día de los Difuntos',
  '12-25': 'Día de la Familia (Navidad)',
};

// Movibles (Carnaval, Semana de Turismo) por año.
const MOVIBLES: Record<string, string> = {
  '2026-02-16': 'Carnaval',
  '2026-02-17': 'Carnaval',
  '2026-03-30': 'Semana de Turismo',
  '2026-03-31': 'Semana de Turismo',
  '2026-04-01': 'Semana de Turismo',
  '2026-04-02': 'Semana de Turismo',
  '2026-04-03': 'Semana de Turismo',
};

/** Devuelve el nombre del feriado si la fecha (ISO o Date) cae en uno, o null. */
export function feriadoDe(fecha?: string | Date | null): string | null {
  if (!fecha) return null;
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const full = `${d.getFullYear()}-${mm}-${dd}`;
  return MOVIBLES[full] ?? FIJOS[`${mm}-${dd}`] ?? null;
}
