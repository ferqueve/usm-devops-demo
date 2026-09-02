import { useState, useEffect, useCallback } from 'react';
import { espaciosApi } from '@/lib/api/spaces';
import type { Espacio } from '@/lib/types/spaces';
import { toast } from 'sonner';

// Caché global compartido entre todos los componentes
let espaciosCache: Espacio[] | null = null;
let cacheTimestamp: number = 0;
let pendingRequest: Promise<Espacio[]> | null = null;

// Duración del caché: 5 minutos
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Hook personalizado para obtener la lista de espacios
 *
 * Características:
 * - Caché global compartido entre componentes (5 minutos)
 * - Una sola llamada HTTP aunque múltiples componentes lo usen
 * - Manejo automático de loading y errores
 * - Función refresh() para invalidar caché
 *
 * @returns {object} { espacios, loading, error, refresh }
 *
 * @example
 * const { espacios, loading, error, refresh } = useEspacios();
 */
export function useEspacios() {
  const [espacios, setEspacios] = useState<Espacio[]>(espaciosCache || []);
  const [loading, setLoading] = useState<boolean>(!espaciosCache);
  const [error, setError] = useState<Error | null>(null);

  const fetchEspacios = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    // Si hay caché válido y no es refresh forzado, usar caché
    if (!forceRefresh && espaciosCache && now - cacheTimestamp < CACHE_DURATION) {
      setEspacios(espaciosCache);
      setLoading(false);
      return espaciosCache;
    }

    // Si ya hay una petición en curso, esperar a que termine
    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        setEspacios(result);
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
        const response = await espaciosApi.obtenerEspacios();

        if (response.data) {
          // Actualizar caché global
          espaciosCache = response.data;
          cacheTimestamp = Date.now();

          setEspacios(response.data);
          return response.data;
        }

        throw new Error('No se recibieron datos');
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error('Error al cargar espacios:', error);

        if (forceRefresh) {
          toast.error('Error al cargar espacios');
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
    // fetchEspacios relanza el error para quien llame a refresh(); en la carga
    // inicial nadie lo espera, y sin este catch queda como unhandled rejection.
    // El error ya quedó guardado en el estado del hook.
    fetchEspacios().catch(() => {});
  }, [fetchEspacios]);

  /**
   * Invalida el caché y recarga los espacios
   */
  const refresh = useCallback(async () => {
    espaciosCache = null;
    cacheTimestamp = 0;
    return fetchEspacios(true);
  }, [fetchEspacios]);

  return {
    espacios,
    loading,
    error,
    refresh,
  };
}

/**
 * Función de utilidad para invalidar el caché manualmente
 * Útil cuando se crea/actualiza/elimina un espacio
 */
export function invalidateEspaciosCache() {
  espaciosCache = null;
  cacheTimestamp = 0;
}
