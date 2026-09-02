// ============================================================================
// Tipos para el módulo de Recursos Académicos
// ============================================================================

export type RecursoTipo = 'ARCHIVO' | 'ENLACE';

export interface Recurso {
  id: number;
  materiaId: number;
  titulo: string;
  descripcion?: string | null;
  tipo: RecursoTipo;
  /** URL pública: descarga si ARCHIVO, enlace externo si ENLACE */
  url: string;
  mimeType?: string | null;
  tamanoBytes?: number | null;
  paginasEstimadas?: number | null;
  subidoPorNombre?: string | null;
  createdAt?: string | null;
}
