import { carrerasApi } from '@/lib/api/carreras';
import type { Carrera } from '@/lib/types/spaces';
import { crearCacheDeLista, CACHE_LARGO } from './cacheDeLista';

/**
 * La lista de carreras, pedida una vez y compartida entre componentes.
 *
 * El caché lo hace `crearCacheDeLista`: esto sólo le pone el nombre del campo
 * que devuelve, para no tocar a los componentes que ya lo usaban.
 */
const cache = crearCacheDeLista<Carrera>({
  pedir: () => carrerasApi.obtenerCarreras(),
  nombre: 'las carreras',
  duracion: CACHE_LARGO,
});

export function useCarreras() {
  const { datos, loading, error, refresh } = cache.useLista();
  return { carreras: datos, loading, error, refresh };
}

/** Vacía el caché sin pedir, para después de crear, editar o borrar. */
export const invalidateCarrerasCache = cache.invalidar;
