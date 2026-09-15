import { useTheme } from 'next-themes';

/** Mezcla dos colores hex. Sólido, sin transparencia: sobre el fondo oscuro de un svg un rgba se ensucia. */
export function mezclar(desde: string, hasta: string, t: number): string {
  const k = Math.max(0, Math.min(1, t));
  const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(canal(desde, i) + (canal(hasta, i) - canal(desde, i)) * k));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Colores de los gráficos de estadísticas, uno por tema.
 *
 * - Estado: verde/ámbar/gris/rojo significan lo mismo en toda la pantalla y
 *   siempre van con su etiqueta, nunca solos.
 * - Categorías: orden fijo; un color sigue a su categoría, no a su posición.
 * - Secuencial: una sola tinta (azul) de claro a oscuro.
 */
const CLARO = {
  aprobadas: '#5f9433',
  pendientes: '#c98a00',
  vencidas: '#8a8f98',
  canceladas: '#c9372c',
  disponible: '#5f9433',
  mantenimiento: '#c98a00',
  danado: '#c9372c',
  categorias: ['#1f55ab', '#0e8a74', '#c8641a', '#7c4dbe', '#b0306a', '#5b6472'],
  secuencial: (t: number): string => mezclar('#e3ebf7', '#1f55ab', t),
  secuencialTexto: (t: number): string => (t > 0.5 ? '#ffffff' : '#1f2937'),
  positivo: '#0e8a74',
  negativo: '#c9372c',
  grilla: '#eceef1',
  eje: '#6b7280',
  vacio: '#eef0f3',
  superficie: '#ffffff',
};

const OSCURO: typeof CLARO = {
  aprobadas: '#6fa23e',
  pendientes: '#d49b1c',
  vencidas: '#71717a',
  canceladas: '#e0564a',
  disponible: '#6fa23e',
  mantenimiento: '#d49b1c',
  danado: '#e0564a',
  categorias: ['#4f80d6', '#12a08a', '#d9782c', '#9b74d9', '#d0578b', '#8b93a1'],
  secuencial: (t: number): string => mezclar('#26324a', '#6f9be6', t),
  secuencialTexto: (t: number): string => (t > 0.55 ? '#0b1220' : '#e5e7eb'),
  positivo: '#12a08a',
  negativo: '#e0564a',
  grilla: '#2f3237',
  eje: '#a1a1aa',
  vacio: '#26292e',
  superficie: '#1c1c1f',
};

export type TemaGraficos = typeof CLARO;

export function useTemaGraficos(): TemaGraficos {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? OSCURO : CLARO;
}

export const formatoNumero = (v: number) => Math.round(v).toLocaleString('es-UY');
