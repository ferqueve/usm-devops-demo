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
  prerrequisitoIds?: number[] | null;
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

// ============================================================================
// Mapa de correlativas (skill-tree de la carrera)
// ============================================================================

export type EstadoMapa = 'APROBADA' | 'CURSANDO' | 'DISPONIBLE' | 'BLOQUEADA';

export interface MapaNodo {
  id: number;
  nombre: string;
  codigo?: string | null;
  semestre?: number | null;
  creditos?: number | null;
  docenteId?: number | null;
  docenteNombre?: string | null;
  totalInscriptos: number;
  prerrequisitoIds: number[];
  estado?: EstadoMapa | null;
}

export interface MapaCarrera {
  carreraId: number;
  carreraNombre: string;
  materias: MapaNodo[];
  totalMaterias: number;
  materiasAprobadas: number;
  totalCreditos: number;
  creditosAprobados: number;
  conProgreso: boolean;
}
