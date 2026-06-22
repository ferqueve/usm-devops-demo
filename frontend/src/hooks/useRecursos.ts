import { useCallback, useEffect, useState } from 'react';
import { recursosApi } from '@/lib/api/recursos';
import type { Recurso } from '@/lib/types/recursos';

/**
 * Hook para obtener y gestionar los recursos académicos de una materia.
 *
 * @param materiaId ID de la materia
 * @returns { recursos, loading, error, refresh }
 */
export function useRecursos(materiaId: number) {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecursos = useCallback(async () => {
    if (!materiaId) {
      setRecursos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await recursosApi.listarRecursos(materiaId);
      setRecursos(response.data ?? []);
    } catch (err) {
      const e = err as Error;
      setError(e);
      console.error('Error al cargar recursos:', e);
    } finally {
      setLoading(false);
    }
  }, [materiaId]);

  useEffect(() => {
    fetchRecursos();
  }, [fetchRecursos]);

  const refresh = useCallback(() => fetchRecursos(), [fetchRecursos]);

  return { recursos, loading, error, refresh };
}
