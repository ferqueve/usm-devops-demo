import { useCallback, useEffect, useState } from 'react';
import { eventosApi } from '@/lib/api/eventos';
import type { Evento } from '@/lib/types/eventos';
import { toast } from 'sonner';

/**
 * Hook para gestionar los eventos / oferta abierta.
 *
 * Devuelve el listado de eventos (filtrado por rol en el backend) junto con
 * las inscripciones del usuario actual, además de helpers de carga/refresh.
 */
export function useEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [misInscripciones, setMisInscripciones] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEventos = useCallback(async (showToast = false) => {
    setLoading(true);
    setError(null);
    try {
      const [eventosRes, inscripcionesRes] = await Promise.all([
        eventosApi.listar(),
        eventosApi.misInscripciones().catch(() => ({ success: false, data: [] as Evento[] })),
      ]);

      if (eventosRes.data) {
        setEventos(eventosRes.data);
      }
      setMisInscripciones(inscripcionesRes.data ?? []);
      return eventosRes.data ?? [];
    } catch (err) {
      const e = err as Error;
      setError(e);
      console.error('Error al cargar eventos:', e);
      if (showToast) {
        toast.error('Error al cargar eventos');
      }
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const refresh = useCallback(() => fetchEventos(true), [fetchEventos]);

  return {
    eventos,
    misInscripciones,
    loading,
    error,
    refresh,
  };
}
