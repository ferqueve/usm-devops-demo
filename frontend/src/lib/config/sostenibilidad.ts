/**
 * Factores del dashboard de sostenibilidad.
 *
 * Los factores AMBIENTALES base (papel/CO2/agua por hoja, árboles, km auto) se
 * calculan en el backend (`SostenibilidadService`) y llegan ya resueltos en las
 * stats. Acá viven solo los divisores de las EQUIVALENCIAS COTIDIANAS que el
 * front usa para hacer las cifras más tangibles, y la meta por defecto.
 *
 * Fuente única: no repartir estos números por el TSX.
 */

/** Meta anual de hojas evitadas por defecto (editable por el usuario, persistida en localStorage). */
export const META_HOJAS_DEFAULT = 5000;
export const META_HOJAS_STORAGE_KEY = 'sosten_meta_hojas';

/** Tope de hojas usado para normalizar el índice de impacto (0..1). */
export const IMPACTO_HOJAS_TOPE = META_HOJAS_DEFAULT;

/** Divisores para traducir el ahorro a equivalencias del día a día. */
export const EQUIVALENCIAS = {
  /** Litros de agua por ducha de 8 min. */
  aguaLitrosPorDucha: 65,
  /** Gramos de CO2 por carga completa de celular. */
  co2GramosPorCargaCelular: 8.22,
  /** Metros recorridos por una vuelta a la cancha en auto. */
  metrosPorVueltaCancha: 105,
  /** Litros de agua por taza. */
  aguaLitrosPorTaza: 0.25,
} as const;
