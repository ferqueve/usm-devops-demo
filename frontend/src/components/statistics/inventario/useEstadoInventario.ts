import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { statsApi, type DemandaInventario, type EstadoInventario, type FiltrosInventario } from '@/lib/api/stats';

const CLAVES = { edificioId: 'edificio', espacioId: 'espacio', tipoElementoId: 'tipo' } as const;

function numero(valor: string | null): number | null {
  if (!valor) return null;
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Filtros de la vista de inventario, en la URL (?edificio=&espacio=&tipo=)
 * como el período: sobreviven a recargar y se pueden compartir.
 */
export function useFiltrosInventario() {
  const [params, setParams] = useSearchParams();

  const filtros = useMemo<FiltrosInventario>(
    () => ({
      edificioId: numero(params.get(CLAVES.edificioId)),
      espacioId: numero(params.get(CLAVES.espacioId)),
      tipoElementoId: numero(params.get(CLAVES.tipoElementoId)),
    }),
    [params],
  );

  const cambiar = useCallback(
    (cambios: FiltrosInventario) => {
      setParams(
        (prev) => {
          const siguiente = new URLSearchParams(prev);
          for (const [campo, valor] of Object.entries(cambios) as Array<[keyof FiltrosInventario, number | null]>) {
            if (valor == null) siguiente.delete(CLAVES[campo]);
            else siguiente.set(CLAVES[campo], String(valor));
          }
          return siguiente;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const activos = filtros.edificioId != null || filtros.espacioId != null || filtros.tipoElementoId != null;

  return {
    filtros,
    activos,
    cambiar,
    limpiar: () => cambiar({ edificioId: null, espacioId: null, tipoElementoId: null }),
  };
}

/**
 * El estado del inventario para los filtros elegidos. Al cambiar un filtro se
 * mantienen los datos anteriores hasta que llegan los nuevos, en vez de
 * vaciar la pantalla entera como antes.
 */
export function useEstadoInventario(filtros: FiltrosInventario) {
  const [estado, setEstado] = useState<EstadoInventario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  const { edificioId, espacioId, tipoElementoId } = filtros;

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    statsApi
      .estadoInventario({ edificioId, espacioId, tipoElementoId })
      .then((res) => {
        if (cancelado) return;
        if (res.data) {
          setEstado(res.data);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch((e) => {
        console.error('Error cargando el estado del inventario', e);
        if (!cancelado) {
          setError(true);
          toast.error('No se pudo cargar el inventario');
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [edificioId, espacioId, tipoElementoId, version]);

  return { estado, cargando, error, recargar: () => setVersion((v) => v + 1) };
}

/**
 * Los equipos pedidos con las reservas del período, con los mismos filtros
 * que el estado. A diferencia del estado, depende del período. Conserva los
 * datos al volver a pedir y, si falla, sólo esa sección queda vacía.
 */
export function useDemandaInventario(rango: { desde: string; hasta: string }, filtros: FiltrosInventario) {
  const [demanda, setDemanda] = useState<DemandaInventario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const { edificioId, espacioId, tipoElementoId } = filtros;
  const { desde, hasta } = rango;

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    statsApi
      .demandaInventario({ desde, hasta, edificioId, espacioId, tipoElementoId })
      .then((res) => {
        if (cancelado) return;
        setDemanda(res.data ?? null);
        setError(!res.data);
      })
      .catch((e) => {
        console.error('Error cargando la demanda de equipos', e);
        if (!cancelado) {
          setDemanda(null);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [desde, hasta, edificioId, espacioId, tipoElementoId, version]);

  return { demanda, cargando, error, recargar: () => setVersion((v) => v + 1) };
}
