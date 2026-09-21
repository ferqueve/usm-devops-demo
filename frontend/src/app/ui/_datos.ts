import { Activity, Building2, CalendarClock, ClipboardCheck, Inbox, Users } from 'lucide-react';
import { MARCA } from '@/lib/design/paleta';

/**
 * Datos de muestra del catálogo.
 *
 * Inventados pero con la forma y el orden de magnitud de los reales: un
 * gráfico con tres valores redondos miente sobre cómo se va a ver con
 * catorce aulas y cifras de cuatro dígitos. Los nombres salen del dominio
 * —aulas, carreras, tutorías— para que se lea como la app y no como un
 * ejemplo de librería.
 */

export const SERIE_MESES: Record<string, number> = {
  '2026-04': 820, '2026-05': 1180, '2026-06': 960,
  '2026-07': 1540, '2026-08': 2100, '2026-09': 1870,
};

export const KPIS = [
  { label: 'A aprobar', value: '4.678', serie: SERIE_MESES, delta: -18, icon: Inbox },
  { label: 'Hoy', value: 94, hint: 'reservas programadas', icon: CalendarClock },
  { label: 'Espacios', value: '13/13', hint: 'todos disponibles', icon: Building2 },
  { label: 'Usuarios activos', value: 116, hint: 'en este momento', icon: Users },
  { label: 'Inventario', value: '7.458', hint: 'solicitudes pendientes', icon: ClipboardCheck },
  { label: 'Aprobación', value: '67%', hint: 'últimas reservas', icon: Activity },
];

/* ---------------------------------------------------------------- *
 * Gráficos de estadísticas
 * ---------------------------------------------------------------- */

export const PORCIONES = [
  { nombre: 'Aprobadas', valor: 11171, color: MARCA.verde },
  { nombre: 'Pendientes', valor: 4678, color: MARCA.amarillo },
  { nombre: 'Canceladas', valor: 946, color: MARCA.rojo },
];

export const GRUPOS_WAFFLE = [
  { nombre: 'Aula teórica', valor: 46, color: MARCA.azul },
  { nombre: 'Laboratorio', valor: 31, color: MARCA.verde },
  { nombre: 'Anfiteatro', valor: 14, color: MARCA.naranja },
  { nombre: 'Sala chica', valor: 9, color: MARCA.cian },
];

export const ETAPAS_EMBUDO = [
  { nombre: 'Solicitadas', valor: 16795, color: MARCA.azul, detalle: 'todas las que entraron' },
  { nombre: 'Revisadas', valor: 12117, color: MARCA.cian, detalle: '72 % de las solicitadas' },
  { nombre: 'Aprobadas', valor: 11171, color: MARCA.verde, detalle: '92 % de las revisadas' },
  { nombre: 'Usadas', valor: 9840, color: MARCA.amarillo, detalle: '88 % de las aprobadas' },
];

export const FILAS_APILADAS = [
  {
    etiqueta: 'Mismo día',
    segmentos: [
      { nombre: 'Aprobada', valor: 120, color: MARCA.verde },
      { nombre: 'Pendiente', valor: 260, color: MARCA.amarillo },
      { nombre: 'Cancelada', valor: 90, color: MARCA.rojo },
    ],
  },
  {
    etiqueta: 'Una semana',
    segmentos: [
      { nombre: 'Aprobada', valor: 680, color: MARCA.verde },
      { nombre: 'Pendiente', valor: 210, color: MARCA.amarillo },
      { nombre: 'Cancelada', valor: 60, color: MARCA.rojo },
    ],
  },
  {
    etiqueta: 'Un mes o más',
    segmentos: [
      { nombre: 'Aprobada', valor: 810, color: MARCA.verde },
      { nombre: 'Pendiente', valor: 95, color: MARCA.amarillo },
      { nombre: 'Cancelada', valor: 40, color: MARCA.rojo },
    ],
  },
];

export const FILAS_DIVERGENTES = [
  { nombre: 'Docentes', valor: 113, detalle: '1.751 → 3.724' },
  { nombre: 'Externos', valor: 112, detalle: '587 → 1.245' },
  { nombre: 'Edificio A y B', valor: 45, detalle: '1.691 → 2.455' },
  { nombre: 'Sala de Lactancia', valor: -3, detalle: '124 → 120', neutro: true },
  { nombre: 'Aula teórica 1', valor: -28, detalle: '910 → 655' },
];

export const TRAMOS = [
  {
    etiqueta: 'Mañana',
    nota: '08:00 – 12:00',
    segmentos: [
      { nombre: 'Clases', valor: 420, color: MARCA.azul },
      { nombre: 'Tutorías', valor: 180, color: MARCA.verde },
      { nombre: 'Eventos', valor: 60, color: MARCA.naranja },
    ],
  },
  {
    etiqueta: 'Tarde',
    nota: '12:00 – 18:00',
    segmentos: [
      { nombre: 'Clases', valor: 610, color: MARCA.azul },
      { nombre: 'Tutorías', valor: 240, color: MARCA.verde },
      { nombre: 'Eventos', valor: 145, color: MARCA.naranja },
    ],
  },
  {
    etiqueta: 'Noche',
    nota: '18:00 – 22:00',
    segmentos: [
      { nombre: 'Clases', valor: 380, color: MARCA.azul },
      { nombre: 'Tutorías', valor: 95, color: MARCA.verde },
      { nombre: 'Eventos', valor: 210, color: MARCA.naranja },
    ],
  },
];

export const FILAS_MANCUERNA = [
  { clave: 1, nombre: 'Programación I', detalle: 'Tecnólogo en Informática', a: 18, b: 26 },
  { clave: 2, nombre: 'Cálculo I', detalle: 'Ingeniería en Mecatrónica', a: 11, b: 24 },
  { clave: 3, nombre: 'Bases de Datos', detalle: 'Análisis y Desarrollo', a: 21, b: 23 },
  { clave: 4, nombre: 'Machine Learning', detalle: 'Datos e IA', a: 7, b: 19 },
];

export const NODOS_ARBOL = [
  { nombre: 'Aula 8', valor: 2455, color: MARCA.azul, detalle: '396 pendientes' },
  { nombre: 'Laboratorio Mecatrónica', valor: 1870, color: MARCA.verde, detalle: '210 pendientes' },
  { nombre: 'Anfiteatro', valor: 1210, color: MARCA.naranja, detalle: '88 pendientes' },
  { nombre: 'Aula teórica 4', valor: 940, color: MARCA.cian, detalle: '54 pendientes' },
  { nombre: 'Aula 11', valor: 720, color: MARCA.rojo, detalle: '201 pendientes' },
  { nombre: 'Sala de Lactancia', valor: 310, color: MARCA.amarillo, detalle: '12 pendientes' },
];

export const PUNTOS_BURBUJA = [
  { nombre: 'Aula 8', x: 34, y: 82, z: 2455 },
  { nombre: 'Laboratorio Mecatrónica', x: 25, y: 91, z: 1870 },
  { nombre: 'Anfiteatro', x: 100, y: 46, z: 1210 },
  { nombre: 'Aula teórica 4', x: 30, y: 63, z: 940 },
  { nombre: 'Sala de Lactancia', x: 5, y: 28, z: 310 },
];

export const DIAS_SEMANA = [
  { dia: 'lun', valor: 2455 },
  { dia: 'mar', valor: 2110 },
  { dia: 'mié', valor: 2380 },
  { dia: 'jue', valor: 1990 },
  { dia: 'vie', valor: 1540 },
  { dia: 'sáb', valor: 420 },
  { dia: 'dom', valor: 95 },
];

/** Noventa días de ocupación, con una caída de fin de semana marcada. */
export const DIAS_CALOR = Array.from({ length: 90 }, (_, i) => {
  const fecha = new Date(2026, 5, 20 + i);
  const finde = fecha.getDay() === 0 || fecha.getDay() === 6;
  const base = finde ? 4 : 30 + Math.round(24 * Math.sin(i / 7));
  return {
    fecha: fecha.toISOString().slice(0, 10),
    valor: Math.max(0, base + (i % 5) * 3),
  };
});

const HORAS = [8, 10, 12, 14, 16, 18, 20];
const AULAS = ['Aula 8', 'Aula 11', 'Laboratorio Mecatrónica', 'Anfiteatro', 'Aula teórica 4'];

export const MATRIZ = {
  filas: AULAS,
  columnas: HORAS,
  celdas: AULAS.flatMap((fila, f) =>
    HORAS.map((columna, h) => ({
      fila,
      columna,
      valor: Math.min(100, 18 + ((f * 7 + h * 13) % 80)),
      marca: f === 0 && h === 3 ? 1 : undefined,
      detalle: `${fila} · ${columna}:00`,
    }))
  ),
};

export const KPIS_ESTADISTICAS = [
  { etiqueta: 'Reservas', valor: '8.192', detalle: '113 personas pidieron', icono: Inbox, fondo: 'dark' as const, serie: [520, 610, 580, 720, 810, 790], cambio: 106 },
  { etiqueta: 'Aprobadas', valor: '5.256', detalle: '64 % del total', icono: ClipboardCheck, fondo: 'green' as const, serie: [310, 380, 360, 450, 520, 505], cambio: 43 },
  { etiqueta: 'Pendientes', valor: '2.460', detalle: '2.456 ya vencidas', icono: CalendarClock, fondo: 'yellow' as const, serie: [90, 120, 140, 190, 240, 236], cambio: 42 },
  { etiqueta: 'Canceladas', valor: '476', detalle: '6 % del total', icono: Activity, fondo: 'red' as const, serie: [20, 28, 24, 41, 52, 48], cambio: 106 },
];
