// ============================================================================
// Tipos para el módulo de Materias e Inscripciones
// ============================================================================

export interface Materia {
  id: number;
  nombre: string;
  codigo?: string | null;
  descripcion?: string | null;
  carreraId?: number | null;
  carreraNombre?: string | null;
  docenteId?: number | null;
  docenteNombre?: string | null;
  semestre?: number | null;
  creditos?: number | null;
  totalInscriptos?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Inscripcion {
  id: number;
  materiaId: number;
  materiaNombre: string;
  estudianteId: number;
  estudianteNombre: string;
  estado: string;
  createdAt: string;
}
