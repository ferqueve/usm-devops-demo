import { useState, useEffect, useCallback } from 'react';
import { inventarioApi } from '@/lib/api/inventory';
import type { TipoElemento } from '@/lib/types/spaces';
import { toast } from 'sonner';

// Caché global compartido entre todos los componentes
let tiposElementoCache: TipoElemento[] | null = null;
let cacheTimestamp: number = 0;
let pendingRequest: Promise<TipoElemento[]> | null = null;

// Duración del caché: 10 minutos (los tipos de elemento cambian raramente)
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * Hook personalizado para obtener la lista de tipos de elemento
 *
 * Características:
 * - Caché global compartido entre componentes (10 minutos)
 * - Una sola llamada HTTP aunque múltiples componentes lo usen
 * - Manejo automático de loading y errores
 * - Función refresh() para invalidar caché
 *
 * @returns {object} { tiposElemento, loading, error, refresh }
 *
 * @example
 * const { tiposElemento, loading } = useTiposElemento();
 */
export function useTiposElemento() {
  const [tiposElemento, setTiposElemento] = useState<TipoElemento[]>(tiposElementoCache || []);
  const [loading, setLoading] = useState<boolean>(!tiposElementoCache);
  const [error, setError] = useState<Error | null>(null);

  const fetchTiposElemento = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    // Si hay caché válido y no es refresh forzado, usar caché
    if (!forceRefresh && tiposElementoCache && now - cacheTimestamp < CACHE_DURATION) {
      setTiposElemento(tiposElementoCache);
      setLoading(false);
      return tiposElementoCache;
    }

    // Si ya hay una petición en curso, esperar a que termine
    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        setTiposElemento(result);
        setLoading(false);
        return result;
      } catch (err) {
        setError(err as Error);
        setLoading(false);
        throw err;
      }
    }

    // Nueva petición
    setLoading(true);
    setError(null);

    pendingRequest = (async () => {
      try {
        const response = await inventarioApi.listarTiposElemento();

        if (response.data) {
          // Actualizar caché global
          tiposElementoCache = response.data;
          cacheTimestamp = Date.now();

          setTiposElemento(response.data);
          return response.data;
        }

        throw new Error('No se recibieron datos');
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error('Error al cargar tipos de elemento:', error);

        if (forceRefresh) {
          toast.error('Error al cargar tipos de elemento');
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
    // fetchTiposElemento relanza el error para quien llame a refresh(); en la carga
    // inicial nadie lo espera, y sin este catch queda como unhandled rejection.
    // El error ya quedó guardado en el estado del hook.
    fetchTiposElemento().catch(() => {});
  }, [fetchTiposElemento]);

  /**
   * Invalida el caché y recarga los tipos de elemento
   */
  const refresh = useCallback(async () => {
    tiposElementoCache = null;
    cacheTimestamp = 0;
    return fetchTiposElemento(true);
  }, [fetchTiposElemento]);

  return {
    tiposElemento,
    loading,
    error,
    refresh,
  };
}

/**
 * Función de utilidad para invalidar el caché manualmente
 * Útil cuando se crea/actualiza/elimina un tipo de elemento
 */
export function invalidateTiposElementoCache() {
  tiposElementoCache = null;
  cacheTimestamp = 0;
}
