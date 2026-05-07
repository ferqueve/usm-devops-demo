import { describe, it, expect } from 'vitest';
import {
  ROLES,
  hasRole,
  hasAnyRole,
  canAccessRoute,
  canAccessSidebarItem,
  getUserPermissions,
  getRoleLabel,
  ROLE_LABELS,
  ROLE_BADGE_VARIANTS,
} from '@/lib/config/constants';

describe('ROLES', () => {
  it('contiene los 6 roles', () => {
    expect(Object.keys(ROLES)).toHaveLength(6);
  });
});

describe('hasRole / hasAnyRole', () => {
  it('hasRole positivo', () => {
    expect(hasRole('ADMIN', ROLES.ADMIN)).toBe(true);
  });

  it('hasRole null', () => {
    expect(hasRole(null, ROLES.ADMIN)).toBe(false);
  });

  it('hasAnyRole', () => {
    expect(hasAnyRole('DOCENTE', [ROLES.ADMIN, ROLES.DOCENTE])).toBe(true);
    expect(hasAnyRole('DOCENTE', [ROLES.ADMIN])).toBe(false);
    expect(hasAnyRole(null, [ROLES.ADMIN])).toBe(false);
  });
});

describe('canAccessRoute', () => {
  it('null role -> false', () => {
    expect(canAccessRoute(null, '/dashboard')).toBe(false);
  });

  it('admin puede /audit', () => {
    expect(canAccessRoute('ADMIN', '/audit')).toBe(true);
  });

  it('estudiante no puede /audit', () => {
    expect(canAccessRoute('ESTUDIANTE', '/audit')).toBe(false);
  });

  it('rutas dinámicas con :id', () => {
    expect(canAccessRoute('ADMIN', '/rooms/123')).toBe(true);
  });

  it('rol desconocido -> false', () => {
    expect(canAccessRoute('XXX', '/dashboard')).toBe(false);
  });
});

describe('canAccessSidebarItem', () => {
  it('admin tiene "audit"', () => {
    expect(canAccessSidebarItem('ADMIN', 'audit')).toBe(true);
  });

  it('null -> false', () => {
    expect(canAccessSidebarItem(null, 'dashboard')).toBe(false);
  });

  it('rol desconocido -> false', () => {
    expect(canAccessSidebarItem('XXX', 'dashboard')).toBe(false);
  });
});

describe('getUserPermissions', () => {
  it('null -> null', () => {
    expect(getUserPermissions(null)).toBeNull();
  });

  it('ADMIN -> objeto con name', () => {
    expect(getUserPermissions('ADMIN')?.name).toBe('Admin');
  });
});

describe('getRoleLabel / ROLE_LABELS / ROLE_BADGE_VARIANTS', () => {
  it('label de ADMIN', () => {
    expect(getRoleLabel('ADMIN')).toBe('Admin');
  });

  it('ROLE_LABELS contiene MANTENIMIENTO', () => {
    expect(ROLE_LABELS.MANTENIMIENTO).toBe('Mantenimiento');
  });

  it('ROLE_BADGE_VARIANTS para ADMIN es destructive', () => {
    expect(ROLE_BADGE_VARIANTS.ADMIN).toBe('destructive');
  });
});
