import { useTheme } from 'next-themes';
import { NEUTRO, SERIE_CLARO, SERIE_OSCURO } from '@/lib/design/paleta';

/**
 * Colores de las tres series de la pantalla, uno por tema.
 *
 * El azul UTEC tal cual (#184897) queda por debajo de la banda de luminosidad
 * de un gráfico, y el cian y el verde de marca no llegan a 3:1 sobre fondo
 * claro. Eso sigue siendo cierto: por eso las series no usan el hex crudo sino
 * las variantes de `lib/design/paleta`, que son el mismo tono llevado a la luz
 * donde sí funciona. Antes este archivo resolvía lo mismo con hex escritos a
 * mano que no coincidían con los de estadísticas.
 *
 * Azul frente a naranja porque real contra pronóstico es la comparación que
 * más se mira, y es el par que más se separa, también en daltonismo.
 */
const CLARO = {
  real: SERIE_CLARO.azul,
  prediccion: SERIE_CLARO.naranja,
  reservadas: SERIE_CLARO.verde,
  referencia: NEUTRO.claro.apagado,
  grilla: NEUTRO.claro.grilla,
  eje: NEUTRO.claro.eje,
  hoy: NEUTRO.claro.texto,
};

const OSCURO: typeof CLARO = {
  real: SERIE_OSCURO.azul,
  prediccion: SERIE_OSCURO.naranja,
  reservadas: SERIE_OSCURO.verde,
  referencia: NEUTRO.oscuro.apagado,
  grilla: NEUTRO.oscuro.grilla,
  eje: NEUTRO.oscuro.eje,
  hoy: NEUTRO.oscuro.texto,
};

export type Colores = typeof CLARO;

export function useColores(): Colores {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? OSCURO : CLARO;
}
