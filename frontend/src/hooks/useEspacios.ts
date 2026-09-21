import { espaciosApi } from '@/lib/api/spaces';
import type { Espacio } from '@/lib/types/spaces';
import { crearCacheDeLista, CACHE_CORTO } from './cacheDeLista';

/**
 * La lista de espacios, pedida una vez y compartida entre componentes.
 *
 * El caché lo hace `crearCacheDeLista`: esto sólo le pone el nombre del campo
 * que devuelve, para no tocar a los componentes que ya lo usaban.
 */
const cache = crearCacheDeLista<Espacio>({
  pedir: () => espaciosApi.obtenerEspacios(),
  nombre: 'los espacios',
  duracion: CACHE_CORTO,
});

export function useEspacios() {
  const { datos, loading, error, refresh } = cache.useLista();
  return { espacios: datos, loading, error, refresh };
}

/** Vacía el caché sin pedir, para después de crear, editar o borrar. */
export const invalidateEspaciosCache = cache.invalidar;
