import { http } from '../http';
import type { Carrera } from '../types';

/** GET /carreras */
export function obtenerCarreras(): Promise<Carrera[]> {
  return http.get<Carrera[]>('/carreras');
}
