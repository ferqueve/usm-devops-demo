import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { tutoriasApi } from '@/lib/api/tutorias';
import type { Tutoria } from '@/lib/types/tutorias';

interface UseTutoriasOptions {
  // 'mias' -> /tutorias/mias ; 'todas' -> /tutorias (opcionalmente por materia)
  scope?: 'mias' | 'todas';
  materiaId?: number;
}

/**
 * Hook para obtener tutorías.
 * - scope 'mias': franjas del docente o tutorías agendadas del estudiante.
 * - scope 'todas': listado general (opcionalmente filtrado por materia).
 */
export function useTutorias({ scope = 'todas', materiaId }: UseTutoriasOptions = {}) {
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTutorias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = scope === 'mias'
        ? await tutoriasApi.misTutorias()
        : await tutoriasApi.listar(materiaId);
      setTutorias(response.data ?? []);
      return response.data ?? [];
    } catch (err) {
      const e = err as Error;
      setError(e);
      console.error('Error al cargar tutorías:', e);
      toast.error('Error al cargar tutorías', { description: e.message });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [scope, materiaId]);

  useEffect(() => {
    fetchTutorias().catch(() => {
      /* error ya manejado */
    });
  }, [fetchTutorias]);

  const refresh = useCallback(() => fetchTutorias(), [fetchTutorias]);

  return { tutorias, loading, error, refresh };
}
