import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const useAuthMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
}));

import RoleGuard from '@/components/auth/RoleGuard';

describe('RoleGuard', () => {
  it('muestra spinner mientras carga', () => {
    useAuthMock.mockReturnValue({ user: null, isAuthenticated: false, isLoading: true });
    const { container } = render(
      <RoleGuard>
        <div>contenido</div>
      </RoleGuard>
    );
    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('redirige a /login cuando no está autenticado', () => {
    useAuthMock.mockReturnValue({ user: null, isAuthenticated: false, isLoading: false });
    render(
      <RoleGuard>
        <div>contenido</div>
      </RoleGuard>
    );
    expect(screen.getByTestId('navigate')).toHaveTextContent('/login');
  });

  it('renderiza children cuando rol coincide', () => {
    useAuthMock.mockReturnValue({
      user: { rol: 'ADMIN' },
      isAuthenticated: true,
      isLoading: false,
    });
    render(
      <RoleGuard requiredRole="ADMIN">
        <div>panel</div>
      </RoleGuard>
    );
    expect(screen.getByText('panel')).toBeInTheDocument();
  });

  it('redirige al fallbackPath cuando rol no coincide', () => {
    useAuthMock.mockReturnValue({
      user: { rol: 'USUARIO' },
      isAuthenticated: true,
      isLoading: false,
    });
    render(
      <RoleGuard requiredRole="ADMIN" fallbackPath="/home">
        <div>panel</div>
      </RoleGuard>
    );
    expect(screen.getByTestId('navigate')).toHaveTextContent('/home');
  });
});
