// ============================================================================
// Tipos para usuarios
// ============================================================================

export type UserRole = 'ADMIN' | 'ANALISTA' | 'DOCENTE' | 'ESTUDIANTE' | 'EXTERNO' | 'MANTENIMIENTO';

export interface User {
  id: number;
  email: string;
  nombre: string;
  rol: UserRole;
  rolApp: UserRole; // Para compatibilidad con código existente
  verificado: boolean;
  activo: boolean;
  oauthProv?: string;
  hasPassword?: boolean; // true si el usuario tiene contraseña establecida
  createdAt: string;
  updatedAt: string;
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
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface ChangeRoleRequest {
  rolApp: UserRole;
}

export interface UserStats {
  totalUsuarios: number;
  totalActivos: number;
  totalInactivos: number;
  totalVerificados: number;
  totalNoVerificados: number;
  usuariosPorRol: Record<UserRole, number>;
  usuariosPorProveedor: Record<string, number>;
}

export interface UpdateUserData {
  email?: string;
  nombre?: string;
}

export interface UpdateProfileData {
  nombre?: string;
  password?: string;
  currentPassword?: string; // Contraseña actual para validar antes de cambiar
}
