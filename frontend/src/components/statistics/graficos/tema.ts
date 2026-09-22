import { createContext, useContext } from 'react';
import { useTheme } from 'next-themes';
import {
  MARCA,
  NEUTRO,
  ORDEN_CATEGORIAS,
  SERIE_CLARO,
  SERIE_OSCURO,
  mezclar,
  tintaSobre,
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
    // Se mide contra el color que le toca a la celda. Con un umbral fijo en
    // la mitad de la escala, los tonos del medio quedaban en 2,9:1.
    secuencialTexto: (t: number): string =>
      tintaSobre(
        mezclar(oscuro ? n.vacio : '#e3ebf7', oscuro ? s.azul : MARCA.azul, t),
        oscuro ? n.superficie : '#ffffff',
        n.texto
      ),
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

/**
 * Fuerza el tema de los gráficos para un subárbol, ignorando el global.
 *
 * `useTheme` devuelve el tema de toda la aplicación, así que un contenedor con
 * clase `.dark` anidado cambiaba los colores CSS de lo que tenía adentro pero
 * no los de los gráficos, que eligen su paleta en JavaScript. Con esto un
 * bloque puede declarar en qué tema vive y los gráficos de adentro lo
 * respetan. Lo usa la página /ui para mostrar los dos temas a la vez.
 */
export const TemaGraficosContexto = createContext<'claro' | 'oscuro' | null>(null);

export function useTemaGraficos(): TemaGraficos {
  const forzado = useContext(TemaGraficosContexto);
  const { resolvedTheme } = useTheme();
  if (forzado) return forzado === 'oscuro' ? OSCURO : CLARO;
  return resolvedTheme === 'dark' ? OSCURO : CLARO;
}

export const formatoNumero = (v: number) => Math.round(v).toLocaleString('es-UY');
