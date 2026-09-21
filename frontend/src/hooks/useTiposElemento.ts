import { inventarioApi } from '@/lib/api/inventory';
import type { TipoElemento } from '@/lib/types/spaces';
import { crearCacheDeLista, CACHE_LARGO } from './cacheDeLista';

/**
 * La lista de tiposElemento, pedida una vez y compartida entre componentes.
 *
 * El caché lo hace `crearCacheDeLista`: esto sólo le pone el nombre del campo
 * que devuelve, para no tocar a los componentes que ya lo usaban.
 */
const cache = crearCacheDeLista<TipoElemento>({
  pedir: () => inventarioApi.listarTiposElemento(),
  nombre: 'los tipos de elemento',
  duracion: CACHE_LARGO,
});

export function useTiposElemento() {
  const { datos, loading, error, refresh } = cache.useLista();
  return { tiposElemento: datos, loading, error, refresh };
}

/** Vacía el caché sin pedir, para después de crear, editar o borrar. */
export const invalidateTiposElementoCache = cache.invalidar;
