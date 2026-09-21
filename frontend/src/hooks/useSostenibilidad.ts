import { useState, useEffect, useCallback } from 'react';
import { sostenibilidadApi } from '@/lib/api/sostenibilidad';
import type { SostenibilidadStats } from '@/lib/types/sostenibilidad';
import { toast } from 'sonner';

// Caché global compartido entre todos los componentes
let statsCache: SostenibilidadStats | null = null;
let cacheTimestamp = 0;
let pendingRequest: Promise<SostenibilidadStats> | null = null;

// Duración del caché: 5 minutos (métricas derivadas, cambian poco)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Hook para obtener los KPIs de sostenibilidad.
 *
 * Características:
 * - Caché global compartido entre componentes (5 minutos)
 * - Dedupe: una sola llamada HTTP aunque múltiples componentes lo usen
 * - Manejo automático de loading y errores
 * - Función refresh() para invalidar caché
 *
 * @returns {object} { stats, loading, error, refresh }
 */
export function useSostenibilidad() {
  const [stats, setStats] = useState<SostenibilidadStats | null>(statsCache);
  const [loading, setLoading] = useState<boolean>(!statsCache);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    // Caché válido y no forzado -> usar caché
    if (!forceRefresh && statsCache && now - cacheTimestamp < CACHE_DURATION) {
      setStats(statsCache);
      setLoading(false);
      return statsCache;
    }

    // Petición en curso -> esperar a que termine
    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        setStats(result);
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
        const response = await sostenibilidadApi.obtenerStats();

        if (response.data) {
          statsCache = response.data;
          cacheTimestamp = Date.now();
          setStats(response.data);
          return response.data;
        }

        throw new Error('No se recibieron datos');
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error('Error al cargar sostenibilidad:', error);

        if (forceRefresh) {
          toast.error('Error al cargar métricas de sostenibilidad');
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
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(async () => {
    statsCache = null;
    cacheTimestamp = 0;
    return fetchStats(true);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}

