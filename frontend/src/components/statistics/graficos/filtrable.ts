import type { KeyboardEvent } from 'react';

/**
 * Props para que algo de un gráfico o una tabla filtre la vista al hacerle
 * clic: cursor de mano, "Filtrar por …" al pasar el mouse, y Enter o espacio
 * con el teclado. Sin acción devuelve nada, y el elemento queda como estaba.
 */
export function filtrable(etiqueta: string, accion?: (() => void) | null) {
  if (!accion) return {};
  return {
    role: 'button' as const,
    tabIndex: 0,
    title: `Filtrar por ${etiqueta}`,
    onClick: accion,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        accion();
      }
    },
    className: 'cursor-pointer',
  };
}

/** Clase de hover para filas y leyendas que filtran. */
export const HOVER_FILTRO = 'cursor-pointer rounded-md transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-utec-blue/40';
