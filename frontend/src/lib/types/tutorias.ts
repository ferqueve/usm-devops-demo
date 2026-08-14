export type TutoriaEstado = 'ABIERTA' | 'CERRADA' | 'CANCELADA';
export type TutoriaModalidad = 'PRESENCIAL' | 'VIRTUAL';
export type TutoriaTipo = 'INDIVIDUAL' | 'GRUPAL';
export type TutoriaRecurrencia = 'NONE' | 'DIARIA' | 'SEMANAL' | 'MENSUAL';

export interface TutoriaAgendado {
  reservaId: number;
  estudianteId?: number | null;
  nombre?: string | null;
  email?: string | null;
  estado: string; // AGENDADA | ESPERA | ASISTIO | CANCELADA
  temario?: string | null;
  confirmada?: boolean;
  createdAt?: string | null;
}

export interface Tutoria {
  id: number;
  materiaId: number;
  materiaNombre: string;
  docenteNombre: string;
  espacioId?: number | null;
  espacioNombre?: string | null;
  inicio: string; // ISO instant
  fin: string; // ISO instant
  cupo: number;
  plazasDisponibles: number;
  estado: TutoriaEstado;
  modalidad?: TutoriaModalidad;
  enlace?: string | null;
  tipo?: TutoriaTipo;
  tags?: string | null;
  enVivo?: boolean;
  patron?: string | null;
  createdAt: string;
  agendadosCount?: number;
  enEsperaCount?: number;
  ratingPromedio?: number;
  ratingTotal?: number;
  // Solo en la vista del estudiante (sus tutorías agendadas)
  reservaId?: number | null;
  reservaEstado?: string | null;
  reservaConfirmada?: boolean | null;
  reservaTemario?: string | null;
}

export interface TutoriaCreateInput {
  materiaId: number;
  espacioId?: number | null;
  inicio: string;
  fin: string;
  cupo: number;
  modalidad?: TutoriaModalidad;
  enlace?: string;
  tipo?: TutoriaTipo;
  tags?: string;
  recurrencia?: TutoriaRecurrencia;
  repeticiones?: number;
}

export interface TutoriaUpdateInput {
  materiaId?: number;
  espacioId?: number | null;
  inicio?: string;
  fin?: string;
  cupo?: number;
  estado?: TutoriaEstado;
  modalidad?: TutoriaModalidad;
  enlace?: string;
  tipo?: TutoriaTipo;
  tags?: string;
  patron?: string;
}

// ---- Feedback / satisfacción ----
export interface TutoriaFeedbackItem {
  id: number;
  estudianteNombre?: string;
  rating: number;
  comentario?: string;
  createdAt: string;
}
export interface TutoriaFeedbackResumen {
  promedio: number;
  total: number;
  distribucion: number[];
  miRating?: number | null;
  puedeValorar: boolean;
  items: TutoriaFeedbackItem[];
}

// ---- Recursos ----
export interface TutoriaRecurso {
  id: number;
  titulo: string;
  url: string;
  createdAt?: string;
}

// ---- Ranking de tutores ----
export interface TutorRanking {
  docenteId: number;
  docenteNombre: string;
  promedio: number;
  totalValoraciones: number;
  totalTutorias: number;
  totalEstudiantes: number;
  badge?: string | null;
}

// ---- Gamificación del estudiante ----
export interface RachaBadge {
  id: string;
  nombre: string;
  emoji: string;
  desbloqueado: boolean;
}
export interface Racha {
  asistidas: number;
  agendadas: number;
  rachaActual: number;
  badges: RachaBadge[];
}
