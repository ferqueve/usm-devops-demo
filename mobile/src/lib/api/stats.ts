import { http } from '../http';

export type OcupacionEspacio = {
  espacioId: number;
  espacioNombre: string;
  horasReservadas: number;
  horasDisponibles: number;
  porcentaje: number;
};

export type ResumenEdificio = {
  edificioId: number | null;
  edificioNombre: string;
  cantReservas: number;
};

export type ResumenCarrera = {
  carreraId: number | null;
  carreraNombre: string;
  aprobadas: number;
  canceladas: number;
  tasaCancelacion: number;
};

function rango(desde: string, hasta: string): string {
  return `?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;
}

/** GET /stats/reservas/ocupacion */
export function ocupacionPorEspacio(desde: string, hasta: string): Promise<OcupacionEspacio[]> {
  return http.get<OcupacionEspacio[]>(`/stats/reservas/ocupacion${rango(desde, hasta)}`);
}

/** GET /stats/reservas/por-edificio */
export function resumenPorEdificio(desde: string, hasta: string): Promise<ResumenEdificio[]> {
  return http.get<ResumenEdificio[]>(`/stats/reservas/por-edificio${rango(desde, hasta)}`);
}

/** GET /stats/reservas/por-carrera */
export function resumenPorCarrera(desde: string, hasta: string): Promise<ResumenCarrera[]> {
  return http.get<ResumenCarrera[]>(`/stats/reservas/por-carrera${rango(desde, hasta)}`);
}
