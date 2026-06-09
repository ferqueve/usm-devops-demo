import { http } from '../http';
import type { Page, Reserva, ReservaEstado } from '../types';

export type ReservaQuery = {
  page?: number;
  size?: number;
  estado?: ReservaEstado;
  espacioId?: number;
  carreraId?: number;
  search?: string;
  desde?: string;
  hasta?: string;
};

function toQuery(params: Record<string, unknown>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

export type CrearReservaInput = {
  espacioId: number;
  carreraId?: number;
  inicio: string; // ISO
  fin: string; // ISO
  titulo: string;
  motivoSolicitud?: string;
  esPublica?: boolean;
  analistaId?: number;
};

/** POST /reservas */
export function crearReserva(data: CrearReservaInput): Promise<Reserva> {
  return http.post<Reserva>('/reservas', data);
}

/** GET /reservas/paged — todas las reservas (gestión, según permisos del rol). */
export function obtenerTodasReservasPaged(query: ReservaQuery = {}): Promise<Page<Reserva>> {
  const { page = 0, size = 20, ...rest } = query;
  return http.get<Page<Reserva>>(`/reservas/paged${toQuery({ page, size, ...rest })}`);
}

/** GET /reservas/mis-reservas */
export function obtenerMisReservas(): Promise<Reserva[]> {
  return http.get<Reserva[]>('/reservas/mis-reservas');
}

/** GET /reservas/{id} */
export function obtenerReserva(id: number): Promise<Reserva> {
  return http.get<Reserva>(`/reservas/${id}`);
}

/** PATCH /reservas/{id}/estado */
export function cambiarEstadoReserva(
  id: number,
  estado: ReservaEstado,
  mensajeAnalista?: string,
): Promise<Reserva> {
  return http.patch<Reserva>(`/reservas/${id}/estado`, { estado, mensajeAnalista });
}

export function aprobarReserva(id: number): Promise<Reserva> {
  return cambiarEstadoReserva(id, 'APROBADO');
}

export function rechazarReserva(id: number, mensaje: string): Promise<Reserva> {
  return cambiarEstadoReserva(id, 'CANCELADO', mensaje);
}

/** DELETE /reservas/{id} — cancela una reserva propia. */
export function cancelarReserva(id: number): Promise<void> {
  return http.delete<void>(`/reservas/${id}`);
}
