import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const hasPermission = vi.fn();
const hasAnyPermission = vi.fn();
const hasAllPermissions = vi.fn();

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({ hasPermission, hasAnyPermission, hasAllPermissions }),
}));

import PermissionGuard from '@/components/auth/PermissionGuard';

describe('PermissionGuard', () => {
  it('renderiza children cuando se concede el permiso', () => {
    hasPermission.mockReturnValue(true);
    render(
      <PermissionGuard requiredPermission="inventario:crear">
        <span>visible</span>
      </PermissionGuard>
    );
    expect(screen.getByText('visible')).toBeInTheDocument();
  });

  it('oculta children cuando no hay permiso', () => {
    hasPermission.mockReturnValue(false);
    render(
      <PermissionGuard requiredPermission="inventario:crear">
        <span>oculto</span>
      </PermissionGuard>
    );
    expect(screen.queryByText('oculto')).not.toBeInTheDocument();
  });

  it('muestra fallback cuando showFallback es true', () => {
    hasPermission.mockReturnValue(false);
    render(
      <PermissionGuard
        requiredPermission="inventario:crear"
        showFallback
        fallback={<span>fb</span>}
      >
        <span>oculto</span>
      </PermissionGuard>
    );
    expect(screen.getByText('fb')).toBeInTheDocument();
    expect(screen.queryByText('oculto')).not.toBeInTheDocument();
  });

  it('usa hasAllPermissions cuando requireAll es true', () => {
    hasAllPermissions.mockReturnValue(true);
    render(
      <PermissionGuard
        requiredPermissions={['inventario:ver', 'inventario:editar']}
        requireAll
      >
        <span>ok</span>
      </PermissionGuard>
    );
    expect(hasAllPermissions).toHaveBeenCalled();
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('renderiza children sin permisos especificados', () => {
    render(
      <PermissionGuard>
        <span>siempre</span>
      </PermissionGuard>
    );
    expect(screen.getByText('siempre')).toBeInTheDocument();
  });
});
