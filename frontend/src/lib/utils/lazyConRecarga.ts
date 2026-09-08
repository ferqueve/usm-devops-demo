import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Marca de "ya recargué por esto", para no entrar en bucle. */
export const MARCA_RECARGA = 'chunk-recargado';

type Modulo<P> = { default: ComponentType<P> };

/**
 * Igual que `lazy()`, pero si el chunk no se puede bajar recarga la página una
 * sola vez.
 *
 * Al desplegar cambian los hashes de los archivos: una pestaña abierta desde
 * antes pide un chunk que ya no existe, el import falla y la pantalla queda en
 * blanco hasta que el usuario recarga a mano. La marca en sessionStorage evita
 * que un error real -- estar sin red, por ejemplo -- deje la página recargando
 * en bucle: al segundo intento el error se propaga.
 */
export function lazyConRecarga<P extends object>(
  importar: () => Promise<Modulo<P>>,
): LazyExoticComponent<ComponentType<P>> {
  return lazy(() => cargarConRecarga(importar));
}

/** La carga en sí, separada para poder probarla sin montar React. */
export async function cargarConRecarga<P extends object>(
  importar: () => Promise<Modulo<P>>,
): Promise<Modulo<P>> {
  try {
    const modulo = await importar();
    sessionStorage.removeItem(MARCA_RECARGA);
    return modulo;
  } catch (error) {
    if (sessionStorage.getItem(MARCA_RECARGA)) throw error;
    sessionStorage.setItem(MARCA_RECARGA, '1');
    globalThis.location.reload();
    // La recarga corta la ejecución; la promesa pendiente evita que Suspense
    // muestre un error en ese instante.
    return new Promise<Modulo<P>>(() => {});
  }
}
