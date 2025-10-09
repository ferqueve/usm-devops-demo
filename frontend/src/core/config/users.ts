import type { UserRole } from '../types/types';
import { ROLES, ROLE_PERMISSIONS } from './roles';

// Re-exportar roles como array
export const USER_ROLES = Object.values(ROLES) as readonly UserRole[];

// Helper para obtener label de rol (usa ROLE_PERMISSIONS existente)
export const getRoleLabel = (role: UserRole): string => {
  return ROLE_PERMISSIONS[role]?.name || role;
};

// Labels de roles en español (para uso directo)
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: ROLE_PERMISSIONS.ADMIN.name,
  ANALISTA: ROLE_PERMISSIONS.ANALISTA.name,
  DOCENTE: ROLE_PERMISSIONS.DOCENTE.name,
  ESTUDIANTE: ROLE_PERMISSIONS.ESTUDIANTE.name,
  EXTERNO: ROLE_PERMISSIONS.EXTERNO.name
};

// Variantes de badges para roles (UI específico)
export const ROLE_BADGE_VARIANTS: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ADMIN: 'destructive',
  ANALISTA: 'default',
  DOCENTE: 'secondary',
  ESTUDIANTE: 'outline',
  EXTERNO: 'outline'
};


