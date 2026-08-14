// ============================================================================
// Tipos para el módulo de Eventos / Oferta abierta
// ============================================================================

export type EventoTipo = 'EVENTO' | 'CURSO';

export type EventoEstado = 'BORRADOR' | 'PUBLICADO' | 'FINALIZADO' | 'CANCELADO';

export interface Evento {
  id: number;
  titulo: string;
  descripcion?: string;
  tags?: string; // CSV: "IA,Workshop,Gratuito"
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
  patron?: string; // id del catálogo de patrones (ver eventPatterns)
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

export type EventoRecurrencia = 'NONE' | 'DIARIA' | 'SEMANAL' | 'MENSUAL';

export interface EventoCreatePayload {
  titulo: string;
  descripcion?: string;
  tags?: string;
  tipo?: EventoTipo;
  inicio: string; // ISO instant
  fin?: string;
  cupo?: number;
  esPublico?: boolean;
  espacioId?: number;
  recurrencia?: EventoRecurrencia;
  repeticiones?: number;
}

export interface EventoUpdatePayload {
  titulo?: string;
  descripcion?: string;
  tags?: string;
  tipo?: EventoTipo;
  inicio?: string;
  fin?: string;
  cupo?: number;
  esPublico?: boolean;
  espacioId?: number;
  estado?: EventoEstado;
  patron?: string;
}

// ---- Feedback / satisfacción ----

export interface EventoFeedbackItem {
  id: number;
  usuarioNombre?: string;
  rating: number;
  comentario?: string;
  createdAt: string;
}

export interface EventoFeedbackResumen {
  promedio: number;
  total: number;
  distribucion: number[]; // [#1★, #2★, #3★, #4★, #5★]
  miRating?: number | null;
  puedeValorar: boolean;
  items: EventoFeedbackItem[];
}
