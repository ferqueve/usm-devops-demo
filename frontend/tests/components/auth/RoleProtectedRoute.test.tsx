import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const useAuthMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

const canAccessRouteMock = vi.fn();
const getUserPermissionsMock = vi.fn();
vi.mock('@/lib/config/constants', () => ({
  canAccessRoute: (...args: unknown[]) => canAccessRouteMock(...args),
  getUserPermissions: (...args: unknown[]) => getUserPermissionsMock(...args),
}));

import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';

describe('RoleProtectedRoute', () => {
  it('redirige a /login si no autenticado', () => {
    useAuthMock.mockReturnValue({ user: null, isAuthenticated: false, isLoading: false });
    render(
      <RoleProtectedRoute>
        <div>x</div>
      </RoleProtectedRoute>
    );
    expect(screen.getByTestId('navigate')).toHaveTextContent('/login');
  });

  it('renderiza children cuando puede acceder', () => {
    useAuthMock.mockReturnValue({
      user: { rol: 'ADMIN' },
      isAuthenticated: true,
      isLoading: false,
    });
    canAccessRouteMock.mockReturnValue(true);
    render(
      <RoleProtectedRoute>
        <div>contenido</div>
      </RoleProtectedRoute>
    );
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('redirige al primer route permitido cuando no puede acceder', () => {
    useAuthMock.mockReturnValue({
      user: { rol: 'USUARIO' },
      isAuthenticated: true,
      isLoading: false,
    });
    canAccessRouteMock.mockReturnValue(false);
    getUserPermissionsMock.mockReturnValue({ routes: ['/reservas'] });
    render(
      <RoleProtectedRoute>
        <div>x</div>
      </RoleProtectedRoute>
    );
    expect(screen.getByTestId('navigate')).toHaveTextContent('/reservas');
  });
});
