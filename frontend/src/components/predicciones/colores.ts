import { useTheme } from 'next-themes';

/**
 * Colores de las tres series de la pantalla, uno por tema.
 *
 * No son los institucionales tal cual: el azul UTEC queda por debajo de la
 * banda de luminosidad de un gráfico, y el cian y el verde no llegan a 3:1
 * sobre fondo claro. Estos pasan el validador de paleta (luminosidad, croma,
 * separación para daltonismo y contraste) en claro y en oscuro.
 *
 * Azul frente a naranja porque real contra pronóstico es la comparación que
 * más se mira, y es el par que más se separa.
 */
const CLARO = {
  real: '#1f55ab',
  prediccion: '#c8641a',
  reservadas: '#0e8a74',
  referencia: '#9ca3af',
  grilla: '#eceef1',
  eje: '#6b7280',
  hoy: '#343a40',
};

const OSCURO = {
  real: '#4f80d6',
  prediccion: '#d9782c',
  reservadas: '#12a08a',
  referencia: '#71717a',
  grilla: '#2f3237',
  eje: '#a1a1aa',
  hoy: '#e4e4e7',
};

export type Colores = typeof CLARO;

export function useColores(): Colores {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? OSCURO : CLARO;
}
