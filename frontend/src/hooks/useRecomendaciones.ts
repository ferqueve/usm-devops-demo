import { useState, useEffect, useCallback } from 'react';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import type { DashboardRecomendaciones } from '@/lib/types/recomendaciones';

/**
 * Hook para obtener recomendaciones del dashboard con caché
 */
export function useRecomendacionesDashboard() {
  const [recomendaciones, setRecomendaciones] = useState<DashboardRecomendaciones | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarRecomendaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await recomendacionesApi.obtenerRecomendacionesDashboard();
      if (response.success && response.data) {
        setRecomendaciones(response.data);
      } else {
        setError(response.error || 'Error al cargar recomendaciones');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error cargando recomendaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarRecomendaciones();
  }, [cargarRecomendaciones]);

  return {
    recomendaciones,
    loading,
    error,
    refetch: cargarRecomendaciones,
  };
}

