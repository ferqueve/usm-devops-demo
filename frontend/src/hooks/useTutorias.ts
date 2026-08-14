import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { tutoriasApi } from '@/lib/api/tutorias';
import type { Tutoria } from '@/lib/types/tutorias';

interface UseTutoriasOptions {
  /**
   * Qué listado traer. Antes había un solo 'mias' que el backend resolvía según el
   * rol de quien preguntaba; ahora la vista dice explícitamente cuál quiere.
   * - 'dictadas': las franjas que da el docente.
   * - 'agendadas': las que el estudiante tiene reservadas.
   * - 'todas': listado general (opcionalmente filtrado por materia).
   */
  scope?: 'dictadas' | 'agendadas' | 'todas';
  materiaId?: number;
}

/** Hook para obtener tutorías según el scope pedido. */
export function useTutorias({ scope = 'todas', materiaId }: UseTutoriasOptions = {}) {
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTutorias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (scope === 'dictadas') {
        response = await tutoriasApi.tutoriasQueDicto();
      } else if (scope === 'agendadas') {
        response = await tutoriasApi.tutoriasAgendadas();
      } else {
        response = await tutoriasApi.listar(materiaId);
      }
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
