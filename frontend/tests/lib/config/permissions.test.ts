import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  permissionHelpers,
} from '@/lib/config/permissions';
import { ROLES } from '@/lib/config/constants';

describe('hasPermission', () => {
  it('null role -> false', () => {
    expect(hasPermission(null, 'reserva:crear')).toBe(false);
  });

  it('ADMIN tiene reserva:aprobar', () => {
    expect(hasPermission(ROLES.ADMIN, 'reserva:aprobar')).toBe(true);
  });

  it('ESTUDIANTE no puede crear reserva', () => {
    expect(hasPermission(ROLES.ESTUDIANTE, 'reserva:crear')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('false para arr vacío', () => {
    expect(hasAnyPermission(ROLES.ADMIN, [])).toBe(false);
  });

  it('true si tiene alguno', () => {
    expect(hasAnyPermission(ROLES.ESTUDIANTE, ['reserva:crear', 'espacio:ver'])).toBe(true);
  });

  it('false si role null', () => {
    expect(hasAnyPermission(null, ['espacio:ver'])).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('true cuando todos están', () => {
    expect(hasAllPermissions(ROLES.ADMIN, ['reserva:crear', 'reserva:aprobar'])).toBe(true);
  });

  it('false si falta alguno', () => {
    expect(hasAllPermissions(ROLES.DOCENTE, ['reserva:crear', 'reserva:aprobar'])).toBe(false);
  });

  it('false con arr vacío', () => {
    expect(hasAllPermissions(ROLES.ADMIN, [])).toBe(false);
  });
});

describe('getRolePermissions', () => {
  it('null -> []', () => {
    expect(getRolePermissions(null)).toEqual([]);
  });

  it('ADMIN -> array', () => {
    expect(getRolePermissions(ROLES.ADMIN).length).toBeGreaterThan(0);
  });
});

describe('permissionHelpers', () => {
  it('canCreate reserva ADMIN -> true', () => {
    expect(permissionHelpers.canCreate(ROLES.ADMIN, 'reserva')).toBe(true);
  });

  it('canRead reserva DOCENTE -> true (ver_propias)', () => {
    expect(permissionHelpers.canRead(ROLES.DOCENTE, 'reserva')).toBe(true);
  });

  it('canRead espacio EXTERNO -> true', () => {
    expect(permissionHelpers.canRead(ROLES.EXTERNO, 'espacio')).toBe(true);
  });

  it('canEdit/canDelete', () => {
    expect(permissionHelpers.canEdit(ROLES.ADMIN, 'inventario')).toBe(true);
    expect(permissionHelpers.canDelete(ROLES.ESTUDIANTE, 'inventario')).toBe(false);
  });

  it('canApprove', () => {
    expect(permissionHelpers.canApprove(ROLES.ANALISTA, 'reserva')).toBe(true);
    expect(permissionHelpers.canApprove(ROLES.MANTENIMIENTO, 'solicitud_inventario')).toBe(true);
    expect(permissionHelpers.canApprove(ROLES.ADMIN, 'espacio')).toBe(false);
  });

  it('canCancel', () => {
    expect(permissionHelpers.canCancel(ROLES.DOCENTE, 'reserva')).toBe(true);
    expect(permissionHelpers.canCancel(ROLES.ADMIN, 'espacio')).toBe(false);
  });

  it('canRequest', () => {
    expect(permissionHelpers.canRequest(ROLES.DOCENTE, 'reserva')).toBe(true);
    expect(permissionHelpers.canRequest(ROLES.ANALISTA, 'recomendacion')).toBe(true);
    expect(permissionHelpers.canRequest(ROLES.ADMIN, 'espacio')).toBe(false);
  });

  it('canAssign', () => {
    expect(permissionHelpers.canAssign(ROLES.MANTENIMIENTO, 'inventario')).toBe(true);
    expect(permissionHelpers.canAssign(ROLES.ADMIN, 'reserva')).toBe(false);
  });

  it('canManage', () => {
    expect(permissionHelpers.canManage(ROLES.ADMIN, 'usuario')).toBe(true);
    expect(permissionHelpers.canManage(ROLES.DOCENTE, 'usuario')).toBe(false);
    expect(permissionHelpers.canManage(ROLES.ADMIN, 'espacio')).toBe(false);
  });

  it('canViewOwn / canViewAll', () => {
    expect(permissionHelpers.canViewOwn(ROLES.DOCENTE, 'reserva')).toBe(true);
    expect(permissionHelpers.canViewAll(ROLES.ESTUDIANTE, 'reserva')).toBe(true);
    expect(permissionHelpers.canViewOwn(ROLES.ADMIN, 'espacio')).toBe(false);
  });

  it('canUpload', () => {
    expect(permissionHelpers.canUpload(ROLES.ANALISTA, 'archivo')).toBe(true);
    expect(permissionHelpers.canUpload(ROLES.ESTUDIANTE, 'archivo')).toBe(false);
    expect(permissionHelpers.canUpload(ROLES.ADMIN, 'reserva')).toBe(false);
  });

  it('canManageState', () => {
    expect(permissionHelpers.canManageState(ROLES.MANTENIMIENTO, 'recomendacion')).toBe(true);
    expect(permissionHelpers.canManageState(ROLES.DOCENTE, 'recomendacion')).toBe(false);
    expect(permissionHelpers.canManageState(ROLES.ADMIN, 'reserva')).toBe(false);
  });

  it('canViewStatistics', () => {
    expect(permissionHelpers.canViewStatistics(ROLES.ADMIN, 'estadisticas')).toBe(true);
    expect(permissionHelpers.canViewStatistics(ROLES.ANALISTA, 'recomendacion')).toBe(true);
    expect(permissionHelpers.canViewStatistics(ROLES.ADMIN, 'reserva')).toBe(false);
  });
});
