import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const locationRef = { pathname: '/dashboard' };
vi.mock('react-router-dom', () => ({
  useLocation: () => locationRef,
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarInset: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/layouts/DashboardLayout/DashboardSidebar', () => ({
  DashboardSidebar: () => <div data-testid="sidebar" />,
}));
vi.mock('@/components/layouts/DashboardLayout/DashboardHeader', () => ({
  DashboardHeader: ({ title }: { title?: string }) => <div data-testid="header">{title}</div>,
}));

import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';

describe('DashboardLayout', () => {
  it('renderiza children y deriva titulo desde la ruta', () => {
    locationRef.pathname = '/reservations';
    render(
      <DashboardLayout>
        <span>contenido</span>
      </DashboardLayout>
    );
    expect(screen.getByText('contenido')).toBeInTheDocument();
    expect(screen.getByTestId('header').textContent).toBe('Gestión de Reservas');
  });

  it('respeta titulo explicito', () => {
    locationRef.pathname = '/dashboard';
    render(
      <DashboardLayout title="Custom Title">
        <span>x</span>
      </DashboardLayout>
    );
    expect(screen.getByTestId('header').textContent).toBe('Custom Title');
  });

  it('detecta detalle de espacio y muestra Espacios', () => {
    locationRef.pathname = '/rooms/42';
    render(
      <DashboardLayout>
        <span>x</span>
      </DashboardLayout>
    );
    expect(screen.getByTestId('header').textContent).toBe('Espacios');
  });
});
