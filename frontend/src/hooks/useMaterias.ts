import { materiasApi } from '@/lib/api/materias';
import { useCallback, useEffect, useState } from 'react';
import type { Materia } from '@/lib/types/materias';
import { crearCacheDeLista, CACHE_CORTO } from './cacheDeLista';

/**
 * Todas las materias, pedidas una vez y compartidas entre componentes.
 *
 * `useMisMaterias` es otra cosa: depende de quién mira, así que no se cachea
 * en el módulo.
 */
const cache = crearCacheDeLista<Materia>({
  pedir: () => materiasApi.obtenerMaterias(),
  nombre: 'las materias',
  duracion: CACHE_CORTO,
});

export function useMaterias() {
  const { datos, loading, error, refresh } = cache.useLista();
  return { materias: datos, loading, error, refresh };
}

/** Vacía el caché sin pedir, para después de crear, editar o borrar. */
export const invalidateMateriasCache = cache.invalidar;

export function useMisMaterias(vinculo: 'dicto' | 'curso') {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMisMaterias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = vinculo === 'dicto'
        ? await materiasApi.obtenerMateriasQueDicto()
        : await materiasApi.obtenerMateriasQueCurso();
      setMaterias(response.data ?? []);
      return response.data ?? [];
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error al cargar mis materias:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [vinculo]);

  useEffect(() => {
    fetchMisMaterias().catch(() => {
      // El error ya se almacena en el estado
    });
  }, [fetchMisMaterias]);

  return {
    materias,
    loading,
    error,
    refresh: fetchMisMaterias,
  };
}

