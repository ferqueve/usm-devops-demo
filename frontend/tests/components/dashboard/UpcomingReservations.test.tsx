import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UpcomingReservations from '@/components/dashboard/UpcomingReservations';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

const reserva = {
  id: 1,
  inicio: '2026-01-01T10:00:00',
  fin: '2026-01-01T11:00:00',
  estado: 'APROBADO',
  espacioNombre: 'Aula 101',
  capacidadEspacio: 30,
  usuarioNombre: 'Juan',
  carreraNombre: 'Ing',
} as never;

describe('UpcomingReservations', () => {
  it('renderiza skeleton si loading=true', () => {
    const { container } = render(<UpcomingReservations reservas={[]} loading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('muestra mensaje vacio si no hay reservas', () => {
    render(<UpcomingReservations reservas={[]} />);
    expect(screen.getByText('No hay reservas próximas')).toBeInTheDocument();
  });

  it('renderiza lista de reservas y dispara onViewDetails', async () => {
    const onViewDetails = vi.fn();
    render(<UpcomingReservations reservas={[reserva]} onViewDetails={onViewDetails} />);
    expect(screen.getAllByText('Aula 101').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByText('Ver detalles'));
    expect(onViewDetails).toHaveBeenCalledWith(reserva);
  });
});
