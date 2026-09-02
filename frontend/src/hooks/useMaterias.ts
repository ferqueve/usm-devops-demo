import { useState, useEffect, useCallback } from 'react';
import { materiasApi } from '@/lib/api/materias';
import type { Materia } from '@/lib/types/materias';
import { toast } from 'sonner';

// Caché global compartido entre todos los componentes
let materiasCache: Materia[] | null = null;
let cacheTimestamp = 0;
let pendingRequest: Promise<Materia[]> | null = null;

// Duración del caché: 5 minutos
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Hook para obtener todas las materias activas.
 *
 * Características:
 * - Caché global compartido entre componentes (5 minutos)
 * - Dedupe de peticiones concurrentes
 * - Función refresh() para invalidar caché
 *
 * @returns {object} { materias, loading, error, refresh }
 */
export function useMaterias() {
  const [materias, setMaterias] = useState<Materia[]>(materiasCache || []);
  const [loading, setLoading] = useState<boolean>(!materiasCache);
  const [error, setError] = useState<Error | null>(null);

  const fetchMaterias = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    if (!forceRefresh && materiasCache && now - cacheTimestamp < CACHE_DURATION) {
      setMaterias(materiasCache);
      setLoading(false);
      return materiasCache;
    }

    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        setMaterias(result);
        setLoading(false);
        return result;
      } catch (err) {
        setError(err as Error);
        setLoading(false);
        throw err;
      }
    }

    setLoading(true);
    setError(null);

    pendingRequest = (async () => {
      try {
        const response = await materiasApi.obtenerMaterias();

        if (response.data) {
          materiasCache = response.data;
          cacheTimestamp = Date.now();

          setMaterias(response.data);
          return response.data;
        }

        throw new Error('No se recibieron datos');
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error('Error al cargar materias:', error);

        if (forceRefresh) {
          toast.error('Error al cargar materias');
        }

        throw error;
      } finally {
        setLoading(false);
        pendingRequest = null;
      }
    })();

    return pendingRequest;
  }, []);

  useEffect(() => {
    fetchMaterias();
  }, [fetchMaterias]);

  const refresh = useCallback(async () => {
    materiasCache = null;
    cacheTimestamp = 0;
    return fetchMaterias(true);
  }, [fetchMaterias]);

  return {
    materias,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook para obtener las materias del usuario autenticado, según el vínculo pedido.
 *
 * Antes esto era un solo endpoint que el backend resolvía mirando el rol; ahora la
 * vista dice cuál quiere, porque ya lo sabe.
 *
 * @param vinculo 'dicto' (docente) o 'curso' (estudiante)
 * @returns {object} { materias, loading, error, refresh }
 */
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

/**
 * Invalida el caché de materias manualmente.
 */
export function invalidateMateriasCache() {
  materiasCache = null;
  cacheTimestamp = 0;
}
