import * as React from 'react';

const DENTRO_DE_DIALOGO = '[role="dialog"],[role="alertdialog"]';

/**
 * El último elemento que tuvo el foco fuera de un diálogo.
 *
 * Se lleva a nivel de módulo y no por componente porque el contenido de un
 * diálogo se monta con el diálogo cerrado: un `ref` tomado en el primer
 * render guarda quién tenía el foco al cargar la pantalla —el `body`—, no
 * quién apretó el botón.
 */
let ultimoFuera: HTMLElement | null = null;

if (typeof document !== 'undefined') {
  document.addEventListener(
    'focusin',
    (e) => {
      const el = e.target as HTMLElement | null;
      if (el && el !== document.body && !el.closest?.(DENTRO_DE_DIALOGO)) {
        ultimoFuera = el;
      }
    },
    true
  );
}

/**
 * Devuelve el foco a donde estaba antes de abrir un diálogo.
 *
 * Radix lo hace solo cuando el diálogo se abre desde su propio `Trigger`. Acá
 * casi todos se controlan por estado —`open` y `onOpenChange` desde el
 * componente de arriba—, así que Radix no sabe quién lo abrió y al cerrar el
 * foco se iba al `body`: quien navega con el teclado volvía al principio del
 * documento y tenía que recorrer la pantalla entera otra vez.
 */
export function useDevolverElFoco() {
  const devolver = React.useCallback(() => {
    const destino = ultimoFuera;
    // Si el disparador se fue con el diálogo —una fila que se borró— no hay
    // a dónde volver y se deja que Radix haga lo suyo.
    if (destino && document.contains(destino)) {
      destino.focus();
      return true;
    }
    return false;
  }, []);

  // Radix mueve el foco después de cerrar, así que hacerlo sólo en
  // `onCloseAutoFocus` no alcanza: lo pisa y termina en el `body`.
  React.useEffect(
    () => () => {
      requestAnimationFrame(devolver);
    },
    [devolver]
  );

  return React.useCallback(
    (evento: Event) => {
      if (devolver()) evento.preventDefault();
    },
    [devolver]
  );
}
