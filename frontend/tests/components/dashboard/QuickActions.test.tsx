import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickActions from '@/components/dashboard/QuickActions';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('@/components/auth/PermissionGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('QuickActions', () => {
  it('renderiza 4 acciones rapidas', () => {
    render(<QuickActions />);
    expect(screen.getByText('Nueva Reserva')).toBeInTheDocument();
    expect(screen.getByText('Ver Calendario')).toBeInTheDocument();
    expect(screen.getByText('Gestionar Espacios')).toBeInTheDocument();
    expect(screen.getByText('Ver Estadísticas')).toBeInTheDocument();
  });

  it('navega al hacer click en una accion', async () => {
    render(<QuickActions />);
    await userEvent.click(screen.getByText('Ver Calendario'));
    expect(navigate).toHaveBeenCalledWith('/calendar');
  });
});
