import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const useAuthMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => useAuthMock() }));
vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet" />,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

import { AuthLayout } from '@/components/layouts/AuthLayout/AuthLayout';

describe('AuthLayout', () => {
  it('muestra loading cuando isLoading=true', () => {
    useAuthMock.mockReturnValue({ isLoading: true });
    render(<AuthLayout />);
    expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();
  });

  it('renderiza children cuando no esta cargando', () => {
    useAuthMock.mockReturnValue({ isLoading: false });
    render(
      <AuthLayout>
        <span>contenido</span>
      </AuthLayout>
    );
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('renderiza Outlet sin children', () => {
    useAuthMock.mockReturnValue({ isLoading: false });
    render(<AuthLayout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});
