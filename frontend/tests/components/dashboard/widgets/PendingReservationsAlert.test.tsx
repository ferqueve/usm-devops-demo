import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PendingReservationsAlert from '@/components/dashboard/widgets/PendingReservationsAlert';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const reservas = [{ id: 1 }, { id: 2 }] as never;

describe('PendingReservationsAlert', () => {
  it('no renderiza nada si loading', () => {
    const { container } = render(
      <PendingReservationsAlert reservasPendientes={reservas} loading canApprove />
    );
    expect(container.firstChild).toBeNull();
  });

  it('no renderiza nada si lista vacia', () => {
    const { container } = render(
      <PendingReservationsAlert reservasPendientes={[]} loading={false} canApprove />
    );
    expect(container.firstChild).toBeNull();
  });

  it('mensaje canApprove con boton', () => {
    render(<PendingReservationsAlert reservasPendientes={reservas} loading={false} canApprove />);
    expect(screen.getByText(/Tienes 2 reservas pendientes/)).toBeInTheDocument();
    expect(screen.getByText('Revisar ahora')).toBeInTheDocument();
  });

  it('mensaje sin canApprove sin boton', () => {
    render(<PendingReservationsAlert reservasPendientes={reservas} loading={false} canApprove={false} />);
    expect(screen.getByText(/Tienes 2 solicitudes pendientes/)).toBeInTheDocument();
    expect(screen.queryByText('Revisar ahora')).not.toBeInTheDocument();
  });
});
