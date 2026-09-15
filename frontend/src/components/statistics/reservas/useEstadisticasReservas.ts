import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  statsApi,
  type Aprobacion,
  type Comparacion,
  type ExternosReservas,
  type EspaciosReservas,
  type FiltrosReservas,
  type HeatmapCelda,
  type Novedad,
  type OcupacionEspacio,
  type OpcionesReservas,
  type ResumenCarrera,
  type ResumenEdificio,
  type ResumenReservas,
  type TopUsuario,
} from '@/lib/api/stats';
import type { Rango } from '../periodo';

export interface DatosReservas {
  resumen: ResumenReservas | null;
  ocupacion: OcupacionEspacio[];
  heatmap: HeatmapCelda[];
  carreras: ResumenCarrera[];
  edificios: ResumenEdificio[];
  usuarios: TopUsuario[];
  novedades: Novedad[] | null;
  aprobacion: Aprobacion | null;
  espacios: EspaciosReservas | null;
  externos: ExternosReservas | null;
}

const VACIO: DatosReservas = {
  resumen: null,
  ocupacion: [],
  heatmap: [],
  carreras: [],
  edificios: [],
  usuarios: [],
  novedades: null,
  aprobacion: null,
  espacios: null,
  externos: null,
};

type Clave = keyof DatosReservas;

/** Lo que devolvió un pedido, o null si falló: un endpoint caído no tira la pantalla. */
function valor<T>(r: PromiseSettledResult<{ data?: T | null }>): T | null {
  return r.status === 'fulfilled' ? (r.value?.data ?? null) : null;
}

/**
 * Todo lo de la vista de reservas para un período y unos filtros, en paralelo.
 *
 * - Al cambiar de período o filtro se conservan los datos anteriores hasta que
 *   llegan los nuevos: vaciar la pantalla y volver a llenarla la hace saltar.
 * - Cada pedido falla por su cuenta: su panel queda vacío y el resto se ve.
 * - Resumen y novedades se piden aparte porque son los únicos que cambian con
 *   "comparar contra".
 */
export function useEstadisticasReservas(rango: Rango, filtros: FiltrosReservas = {}, comparar: Comparacion = 'anterior') {
  const [datos, setDatos] = useState<DatosReservas>(VACIO);
  const [fallos, setFallos] = useState<Set<Clave>>(new Set());
  const [cargandoBase, setCargandoBase] = useState(true);
  const [cargandoComparado, setCargandoComparado] = useState(true);
  const [opciones, setOpciones] = useState<OpcionesReservas | null>(null);
  const [version, setVersion] = useState(0);

  const { edificioId = null, espacioId = null, tipoEspacioId = null, rol = null, carreraId = null } = filtros;

  const marcar = useCallback((resultados: Partial<Record<Clave, boolean>>) =>
    setFallos((prev) => {
      const siguiente = new Set(prev);
      for (const [k, fallo] of Object.entries(resultados) as Array<[Clave, boolean]>) {
        if (fallo) siguiente.add(k);
        else siguiente.delete(k);
      }
      return siguiente;
    }), []);

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
    const c = { ...rango, edificioId, espacioId, tipoEspacioId, rol, carreraId };
    setCargandoBase(true);
    Promise.allSettled([
      statsApi.ocupacionPorEspacio(c),
      statsApi.heatmapDiaHora(c),
      statsApi.resumenPorCarrera(c),
      statsApi.resumenPorEdificio(c),
      statsApi.topUsuarios({ ...c, limite: 10 }),
      statsApi.aprobacionReservas(c),
      statsApi.espaciosReservas(c),
      statsApi.externosReservas(c),
    ]).then(([ocupacion, heatmap, carreras, edificios, usuarios, aprobacion, espacios, externos]) => {
      if (cancelado) return;
      const nuevos = {
        ocupacion: valor(ocupacion),
        heatmap: valor(heatmap),
        carreras: valor(carreras),
        edificios: valor(edificios),
        usuarios: valor(usuarios),
        aprobacion: valor(aprobacion),
        espacios: valor(espacios),
        externos: valor(externos),
      };
      setDatos((prev) => ({
        ...prev,
        ocupacion: nuevos.ocupacion ?? [],
        heatmap: nuevos.heatmap ?? [],
        carreras: nuevos.carreras ?? [],
        edificios: nuevos.edificios ?? [],
        usuarios: nuevos.usuarios ?? [],
        aprobacion: nuevos.aprobacion,
        espacios: nuevos.espacios,
        externos: nuevos.externos,
      }));
      const resultado = Object.fromEntries(Object.entries(nuevos).map(([k, v]) => [k, v == null])) as Record<Clave, boolean>;
      marcar(resultado);
      const caidos = Object.values(resultado).filter(Boolean).length;
      if (caidos > 0) {
        console.error(`Estadísticas de reservas: ${caidos} pedidos fallaron`, { ocupacion, heatmap, carreras, edificios, usuarios, aprobacion, espacios, externos });
        toast.error(caidos === 8 ? 'No se pudieron cargar las estadísticas' : 'Algunas estadísticas no se pudieron cargar');
      }
      setCargandoBase(false);
    });
    return () => {
      cancelado = true;
    };
  }, [rango, edificioId, espacioId, tipoEspacioId, rol, carreraId, version, marcar]);

  useEffect(() => {
    let cancelado = false;
    const c = { ...rango, edificioId, espacioId, tipoEspacioId, rol, carreraId, comparar };
    setCargandoComparado(true);
    Promise.allSettled([statsApi.resumenReservas(c), statsApi.novedadesReservas(c)]).then(([resumen, novedades]) => {
      if (cancelado) return;
      const r = valor(resumen);
      const nov = valor(novedades);
      // Sin resumen nuevo se conserva el anterior: es el que sostiene toda la pantalla.
      setDatos((prev) => ({ ...prev, resumen: r ?? prev.resumen, novedades: nov }));
      marcar({ resumen: r == null, novedades: nov == null });
      if (r == null) toast.error('No se pudo cargar el resumen de reservas');
      setCargandoComparado(false);
    });
    return () => {
      cancelado = true;
    };
  }, [rango, edificioId, espacioId, tipoEspacioId, rol, carreraId, comparar, version, marcar]);

  const cargando = cargandoBase || cargandoComparado;
  return {
    ...datos,
    opciones,
    fallos,
    cargando,
    primeraCarga: cargando && datos.resumen === null,
    recargar: () => setVersion((v) => v + 1),
  };
}
