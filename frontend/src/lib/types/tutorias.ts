export type TutoriaEstado = 'ABIERTA' | 'CERRADA' | 'CANCELADA';

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
  createdAt: string;
  // Solo presente en la vista del estudiante (sus tutorías agendadas)
  reservaId?: number | null;
}

export interface TutoriaCreateInput {
  materiaId: number;
  espacioId?: number | null;
  inicio: string; // ISO instant
  fin: string; // ISO instant
  cupo: number;
}

export interface TutoriaUpdateInput {
  materiaId?: number;
  espacioId?: number | null;
  inicio?: string;
  fin?: string;
  cupo?: number;
  estado?: TutoriaEstado;
}
