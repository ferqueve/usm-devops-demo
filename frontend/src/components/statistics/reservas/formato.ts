import type { HeatmapCelda } from '@/lib/api/stats';

export function horas(valor: number): string {
  if (!Number.isFinite(valor) || valor <= 0) return '0 h';
  if (valor < 1) return `${Math.round(valor * 60)} min`;
  if (valor >= 100) return `${Math.round(valor).toLocaleString('es-UY')} h`;
  const h = Math.floor(valor);
  const m = Math.round((valor - h) * 60);
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/**
 * Porcentaje entero que no miente en los bordes: 2.375 de 2.382 no es "100%"
 * ni 3 de 8.214 es "0%".
 */
export function porcentaje(parte: number, total: number): number {
  if (total <= 0 || parte <= 0) return 0;
  const pct = Math.round((parte / total) * 100);
  if (pct === 100 && parte < total) return 99;
  if (pct === 0) return 1;
  return pct;
}

/** "+12% vs período anterior", o null si no hay con qué comparar. */
export function variacion(actual: number, anterior: number): string | null {
  if (anterior <= 0) return null;
  const pct = Math.round(((actual - anterior) / anterior) * 100);
  return `${pct > 0 ? '+' : ''}${pct}% vs anterior`;
}

/** "8 días", "1 día", "menos de un día". */
export function dias(valor: number): string {
  if (!Number.isFinite(valor) || valor < 1) return 'menos de 1 día';
  const d = Math.round(valor);
  return `${d} ${d === 1 ? 'día' : 'días'}`;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Total por día de la semana a partir del mapa día × hora (0 = domingo en Postgres). */
export function semana(celdas: HeatmapCelda[]): Array<{ dia: string; valor: number }> {
  const totales = [0, 0, 0, 0, 0, 0, 0];
  for (const c of celdas) totales[(c.diaSemana + 6) % 7] += Number(c.cant);
  return DIAS_SEMANA.map((dia, i) => ({ dia, valor: totales[i] }));
}

const ROLES: Record<string, string> = {
  ADMIN: 'Admin',
  ANALISTA: 'Analista',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  EXTERNO: 'Externo',
  MANTENIMIENTO: 'Mantenimiento',
};

const ROLES_PLURAL: Record<string, string> = {
  DOCENTE: 'Docentes',
  ESTUDIANTE: 'Estudiantes',
  EXTERNO: 'Externos',
  ANALISTA: 'Analistas',
  ADMIN: 'Administración',
  MANTENIMIENTO: 'Mantenimiento',
};

export const nombreRol = (rol: string) => ROLES[rol] ?? rol;
export const nombreRolPlural = (rol: string) => ROLES_PLURAL[rol] ?? rol;

/** Horas cortas para tiempos de respuesta: "35 min", "5,2 h", "3,1 días". */
export function demora(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return '—';
  if (valor < 1) return `${Math.max(1, Math.round(valor * 60))} min`;
  if (valor < 48) return `${valor.toLocaleString('es-UY', { maximumFractionDigits: valor < 10 ? 1 : 0 })} h`;
  return `${(valor / 24).toLocaleString('es-UY', { maximumFractionDigits: 1 })} días`;
}

export const entero = (v: number | null | undefined) => (v == null ? '—' : Math.round(Number(v)).toLocaleString('es-UY'));

/** "4,3" con una sola cifra decimal, o "—". */
export const rating = (v: number | null | undefined) =>
  v == null || !Number.isFinite(v) ? '—' : Number(v).toLocaleString('es-UY', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
