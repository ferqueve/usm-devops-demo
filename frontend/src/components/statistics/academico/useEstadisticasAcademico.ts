import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { statsApi, type Academico, type FiltrosReservas, type OpcionesReservas } from '@/lib/api/stats';
import type { Rango } from '../periodo';

/**
 * Tutorías y eventos del período con los filtros de la vista. Conserva los
 * datos al volver a pedir: vaciar la pantalla y llenarla la hace saltar.
 */
export function useEstadisticasAcademico(rango: Rango, filtros: FiltrosReservas) {
  const [datos, setDatos] = useState<Academico | null>(null);
  const [opciones, setOpciones] = useState<OpcionesReservas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const { edificioId = null, espacioId = null, tipoEspacioId = null, carreraId = null } = filtros;

  useEffect(() => {
    let cancelado = false;
    statsApi
      .opcionesReservas()
      .then((r) => {
        if (!cancelado) setOpciones(r.data ?? null);
      })
      .catch((e) => console.error('Error cargando las opciones de filtro', e));
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    statsApi
      .academico({ ...rango, edificioId, espacioId, tipoEspacioId, carreraId })
      .then((r) => {
        if (cancelado) return;
        if (r.data) {
          setDatos(r.data);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch((e) => {
        console.error('Error cargando las estadísticas académicas', e);
        if (!cancelado) {
          setError(true);
          toast.error('No se pudieron cargar las estadísticas académicas');
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [rango, edificioId, espacioId, tipoEspacioId, carreraId, version]);

  return { datos, opciones, cargando, error, recargar: () => setVersion((v) => v + 1) };
}
