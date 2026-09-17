import { useTheme } from 'next-themes';
import {
  MARCA,
  NEUTRO,
  ORDEN_CATEGORIAS,
  SERIE_CLARO,
  SERIE_OSCURO,
  mezclar,
} from '@/lib/design/paleta';

export { mezclar };

/**
 * Colores de los gráficos de estadísticas, uno por tema.
 *
 * - Estado: verde/ámbar/gris/rojo significan lo mismo en toda la pantalla y
 *   siempre van con su etiqueta, nunca solos.
 * - Categorías: orden fijo; un color sigue a su categoría, no a su posición.
 * - Secuencial: una sola tinta (azul) de claro a oscuro.
 *
 * Los valores ya no se escriben a mano: salen de `lib/design/paleta`, que
 * los deriva de los hex del manual de marca. Antes este archivo tenía su
 * propio verde (#5f9433), su propio azul (#1f55ab) y su propio rojo
 * (#c9372c), ninguno igual a los del dashboard, y el mismo estado se veía de
 * distinto color según la pantalla.
 */

function construir(s: typeof SERIE_CLARO, n: typeof NEUTRO.claro, oscuro: boolean) {
  return {
    aprobadas: s.verde,
    pendientes: s.amarillo,
    vencidas: n.apagado,
    canceladas: s.rojo,
    disponible: s.verde,
    mantenimiento: s.amarillo,
    danado: s.rojo,
    categorias: ORDEN_CATEGORIAS.map((k) => s[k]),
    secuencial: (t: number): string =>
      mezclar(oscuro ? n.vacio : '#e3ebf7', oscuro ? s.azul : MARCA.azul, t),
    secuencialTexto: (t: number): string =>
      t > (oscuro ? 0.55 : 0.5) ? (oscuro ? n.superficie : '#ffffff') : n.texto,
    positivo: s.verde,
    negativo: s.rojo,
    grilla: n.grilla,
    eje: n.eje,
    vacio: n.vacio,
    superficie: n.superficie,
  };
}

const CLARO = construir(SERIE_CLARO, NEUTRO.claro, false);
const OSCURO: typeof CLARO = construir(SERIE_OSCURO, NEUTRO.oscuro, true);

export type TemaGraficos = typeof CLARO;

export function useTemaGraficos(): TemaGraficos {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? OSCURO : CLARO;
}

export const formatoNumero = (v: number) => Math.round(v).toLocaleString('es-UY');
