// ============================================================================
// Tipos para el módulo de Eventos / Oferta abierta
// ============================================================================

export type EventoTipo = 'EVENTO' | 'CURSO';

export type EventoEstado = 'BORRADOR' | 'PUBLICADO' | 'FINALIZADO' | 'CANCELADO';

export interface Evento {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: EventoTipo;
  inicio: string; // ISO instant
  fin?: string; // ISO instant
  cupo?: number;
  plazasDisponibles?: number;
  esPublico: boolean;
  espacioId?: number;
  espacioNombre?: string;
  organizadorNombre?: string;
  estado: EventoEstado;
  inscriptosCount: number;
  yaInscrito: boolean;
  createdAt: string;
}

export interface EventoInscripto {
  inscripcionId: number;
  usuarioId?: number;
  nombre?: string;
  email?: string;
  estado: string;
  createdAt: string;
}

export interface EventoCreatePayload {
  titulo: string;
  descripcion?: string;
  tipo?: EventoTipo;
  inicio: string; // ISO instant
  fin?: string;
  cupo?: number;
  esPublico?: boolean;
  espacioId?: number;
}

export interface EventoUpdatePayload {
  titulo?: string;
  descripcion?: string;
  tipo?: EventoTipo;
  inicio?: string;
  fin?: string;
  cupo?: number;
  esPublico?: boolean;
  espacioId?: number;
  estado?: EventoEstado;
}
