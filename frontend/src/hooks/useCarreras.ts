import { useState, useEffect, useCallback } from 'react';
import { carrerasApi } from '@/lib/api/carreras';
import type { Carrera } from '@/lib/types/spaces';
import { toast } from 'sonner';

// Caché global compartido entre todos los componentes
let carrerasCache: Carrera[] | null = null;
let cacheTimestamp: number = 0;
let pendingRequest: Promise<Carrera[]> | null = null;

// Duración del caché: 10 minutos (las carreras cambian menos frecuentemente)
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * Hook personalizado para obtener la lista de carreras
 *
 * Características:
 * - Caché global compartido entre componentes (10 minutos)
 * - Una sola llamada HTTP aunque múltiples componentes lo usen
 * - Manejo automático de loading y errores
 * - Función refresh() para invalidar caché
 *
 * @returns {object} { carreras, loading, error, refresh }
 *
 * @example
 * const { carreras, loading } = useCarreras();
 */
export function useCarreras() {
  const [carreras, setCarreras] = useState<Carrera[]>(carrerasCache || []);
  const [loading, setLoading] = useState<boolean>(!carrerasCache);
  const [error, setError] = useState<Error | null>(null);

  const fetchCarreras = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    // Si hay caché válido y no es refresh forzado, usar caché
    if (!forceRefresh && carrerasCache && now - cacheTimestamp < CACHE_DURATION) {
      setCarreras(carrerasCache);
      setLoading(false);
      return carrerasCache;
    }

    // Si ya hay una petición en curso, esperar a que termine
    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        setCarreras(result);
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
        const response = await carrerasApi.obtenerCarreras();

        if (response.data) {
          // Actualizar caché global
          carrerasCache = response.data;
          cacheTimestamp = Date.now();

          setCarreras(response.data);
          return response.data;
        }

        throw new Error('No se recibieron datos');
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error('Error al cargar carreras:', error);

        if (forceRefresh) {
          toast.error('Error al cargar carreras');
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
    fetchCarreras();
  }, [fetchCarreras]);

  /**
   * Invalida el caché y recarga las carreras
   */
  const refresh = useCallback(async () => {
    carrerasCache = null;
    cacheTimestamp = 0;
    return fetchCarreras(true);
  }, [fetchCarreras]);

  return {
    carreras,
    loading,
    error,
    refresh,
  };
}

/**
 * Función de utilidad para invalidar el caché manualmente
 */
export function invalidateCarrerasCache() {
  carrerasCache = null;
  cacheTimestamp = 0;
}
