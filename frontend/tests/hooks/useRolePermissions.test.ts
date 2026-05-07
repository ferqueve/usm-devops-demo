import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { useRolePermissions } from '@/hooks/useRolePermissions';

function setUser(rol: string | null) {
  mockUseAuth.mockReturnValue({
    user: rol ? { id: 1, email: 'a@b.com', nombre: 'A', rol } : null,
  });
}

describe('useRolePermissions', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('usuario sin rol no tiene permisos', () => {
    setUser(null);
    const { result } = renderHook(() => useRolePermissions());
    expect(result.current.userRole).toBeFalsy();
    expect(result.current.hasRole('ADMIN' as never)).toBe(false);
    expect(result.current.hasAnyRole(['ADMIN', 'DOCENTE'] as never[])).toBe(false);
    expect(result.current.canAccessFeature('reservations.create')).toBe(false);
  });

  it('hasRole y hasAnyRole funcionan con rol asignado', () => {
    setUser('ADMIN');
    const { result } = renderHook(() => useRolePermissions());
    expect(result.current.hasRole('ADMIN' as never)).toBe(true);
    expect(result.current.hasRole('DOCENTE' as never)).toBe(false);
    expect(result.current.hasAnyRole(['DOCENTE', 'ADMIN'] as never[])).toBe(true);
    expect(result.current.hasAnyRole(['DOCENTE'] as never[])).toBe(false);
  });

  it('canAccessFeature retorna false para feature desconocido', () => {
    setUser('ADMIN');
    const { result } = renderHook(() => useRolePermissions());
    expect(result.current.canAccessFeature('feature.inexistente')).toBe(false);
  });

  it('expone helpers de permisos como funciones', () => {
    setUser('ADMIN');
    const { result } = renderHook(() => useRolePermissions());
    expect(typeof result.current.canCreate).toBe('function');
    expect(typeof result.current.canRead).toBe('function');
    expect(typeof result.current.canEdit).toBe('function');
    expect(typeof result.current.canDelete).toBe('function');
    expect(typeof result.current.hasPermission).toBe('function');
    expect(typeof result.current.hasAnyPermission).toBe('function');
    expect(typeof result.current.hasAllPermissions).toBe('function');
  });
});
