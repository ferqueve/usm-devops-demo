// ============================================================================
// Tipos para usuarios
// ============================================================================

export type UserRole = 'ADMIN' | 'ANALISTA' | 'DOCENTE' | 'ESTUDIANTE' | 'EXTERNO';

export interface User {
  id: number;
  email: string;
  nombre: string;
  rol: UserRole;
  rolApp: UserRole; // Para compatibilidad con código existente
  verificado: boolean;
  activo: boolean;
  oauthProv?: string;
  createdAt: string;
}

export interface PagedUsers {
  content: User[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface UserFilters {
  search?: string;
  rol?: UserRole;
  verificado?: boolean;
  activo?: boolean;
}

export interface ChangeRoleRequest {
  rolApp: UserRole;
}
