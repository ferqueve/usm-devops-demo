import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Comparacion, FiltrosReservas, Novedad, OpcionesReservas } from '@/lib/api/stats';
import type { TemaGraficos } from '../graficos/tema';
import { nombreRol } from './formato';

/**
 * Nombres en la URL, con un prefijo por vista: inventario ya usa ?edificio= y
 * ?espacio=, y sin prefijo un filtro de reservas quedaba aplicado al pasar a
 * otra pestaña. Reservas usa "r" y académico "a".
 */
export type PrefijoFiltros = 'r' | 'a';

export function clavesFiltros(prefijo: PrefijoFiltros) {
  return {
    edificioId: `${prefijo}edificio`,
    espacioId: `${prefijo}espacio`,
    tipoEspacioId: `${prefijo}tipo`,
    rol: `${prefijo}rol`,
    carreraId: `${prefijo}carrera`,
  } as const;
}

const CLAVE_COMPARAR = 'comparar';

function numero(valor: string | null): number | null {
  if (!valor) return null;
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Los filtros que dice la URL para una vista. */
export function filtrosDeUrl(params: URLSearchParams, prefijo: PrefijoFiltros = 'r'): Required<FiltrosReservas> {
  const claves = clavesFiltros(prefijo);
  return {
    edificioId: numero(params.get(claves.edificioId)),
    espacioId: numero(params.get(claves.espacioId)),
    tipoEspacioId: numero(params.get(claves.tipoEspacioId)),
    rol: prefijo === 'a' ? null : params.get(claves.rol) || null,
    carreraId: numero(params.get(claves.carreraId)),
  };
}

/**
 * Filtros de una vista (reservas o académico) y contra qué se compara, en la
 * URL como el período: sobreviven a recargar y se pueden compartir.
 */
export function useFiltrosReservas(prefijo: PrefijoFiltros = 'r') {
  const [params, setParams] = useSearchParams();
  const claves = clavesFiltros(prefijo);
  const e = params.get(claves.edificioId);
  const s = params.get(claves.espacioId);
  const t = params.get(claves.tipoEspacioId);
  const r = prefijo === 'a' ? null : params.get(claves.rol);
  const c = params.get(claves.carreraId);

  // Por valor y no por el objeto de params: cambiar el período o la sección
  // no tiene que volver a pedir todo como si cambiara un filtro.
  const filtros = useMemo<Required<FiltrosReservas>>(
    () => ({ edificioId: numero(e), espacioId: numero(s), tipoEspacioId: numero(t), rol: r || null, carreraId: numero(c) }),
    [e, s, t, r, c],
  );
  const comparar: Comparacion = params.get(CLAVE_COMPARAR) === 'anio' ? 'anio' : 'anterior';

  const cambiar = useCallback(
    (cambios: FiltrosReservas) => {
      setParams(
        (prev) => {
          const siguiente = new URLSearchParams(prev);
          const k = clavesFiltros(prefijo);
          for (const [campo, valor] of Object.entries(cambios) as Array<[keyof FiltrosReservas, number | string | null]>) {
            if (valor == null || valor === '') siguiente.delete(k[campo]);
            else siguiente.set(k[campo], String(valor));
          }
          return siguiente;
        },
        { replace: true },
      );
    },
    [setParams, prefijo],
  );

  const elegirComparacion = useCallback(
    (nueva: Comparacion) => {
      setParams(
        (prev) => {
          const siguiente = new URLSearchParams(prev);
          if (nueva === 'anterior') siguiente.delete(CLAVE_COMPARAR);
          else siguiente.set(CLAVE_COMPARAR, nueva);
          return siguiente;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const activos = Object.values(filtros).some((v) => v != null);

  return {
    filtros,
    activos,
    cambiar,
    limpiar: () => cambiar({ edificioId: null, espacioId: null, tipoEspacioId: null, rol: null, carreraId: null }),
    comparar,
    elegirComparacion,
  };
}


/** Espacio que queda fuera de un edificio o tipo recién elegido: se descarta. */
export function espacioFuera(opciones: OpcionesReservas | null, filtros: FiltrosReservas, cambios: FiltrosReservas): boolean {
  const espacioId = cambios.espacioId !== undefined ? cambios.espacioId : filtros.espacioId;
  if (espacioId == null || !opciones) return false;
  const espacio = opciones.espacios.find((e) => e.id === espacioId);
  if (!espacio) return false;
  const edificio = cambios.edificioId !== undefined ? cambios.edificioId : filtros.edificioId;
  const tipo = cambios.tipoEspacioId !== undefined ? cambios.tipoEspacioId : filtros.tipoEspacioId;
  return (edificio != null && espacio.edificioId !== edificio) || (tipo != null && espacio.tipoEspacioId !== tipo);
}

/** "Edificio: A | Rol: Docente", con los nombres de las opciones. */
export function textoFiltros(opciones: OpcionesReservas | null, f: FiltrosReservas): string {
  const nombre = (lista: Array<{ id: number; nombre: string }> | undefined, id: number | null | undefined) =>
    id == null ? null : (lista?.find((o) => o.id === id)?.nombre ?? `#${id}`);
  return [
    f.edificioId != null && `Edificio: ${nombre(opciones?.edificios, f.edificioId)}`,
    f.espacioId != null && `Espacio: ${nombre(opciones?.espacios, f.espacioId)}`,
    f.tipoEspacioId != null && `Tipo de espacio: ${nombre(opciones?.tiposEspacio, f.tipoEspacioId)}`,
    f.rol && `Rol: ${nombreRol(f.rol)}`,
    f.carreraId != null && `Carrera: ${nombre(opciones?.carreras, f.carreraId)}`,
  ]
    .filter(Boolean)
    .join(' | ');
}

/** Qué filtro aplica una novedad, si aplica alguno. */
export function filtroDeNovedad(n: Novedad): FiltrosReservas | null {
  if (!n.clave) return null;
  const id = Number(n.clave);
  switch (n.tipo) {
    case 'espacio':
      return Number.isInteger(id) ? { espacioId: id } : null;
    case 'carrera':
      return Number.isInteger(id) ? { carreraId: id } : null;
    case 'edificio':
      return Number.isInteger(id) ? { edificioId: id } : null;
    case 'rol':
      return { rol: n.clave };
    default:
      return null;
  }
}

/** "el período anterior (17 mar al 14 jun)" o "el año pasado (…)". */
export function textoComparacion(comparacion: Comparacion, desde?: string, hasta?: string, fecha: (f: string) => string = (f) => f): string {
  const base = comparacion === 'anio' ? 'el año pasado' : 'el período anterior';
  return desde && hasta ? `${base} (${fecha(desde)} al ${fecha(hasta)})` : base;
}

/** Semáforo de un tiempo de respuesta: hasta un día bien, hasta tres regular. */
export function colorDemora(horas: number | null | undefined, tema: TemaGraficos): string {
  if (horas == null) return tema.vencidas;
  if (horas <= 24) return tema.disponible;
  if (horas <= 72) return tema.mantenimiento;
  return tema.danado;
}
