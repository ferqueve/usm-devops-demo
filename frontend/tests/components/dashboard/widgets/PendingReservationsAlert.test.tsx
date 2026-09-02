import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PendingReservationsAlert from '@/components/dashboard/widgets/PendingReservationsAlert';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe('PendingReservationsAlert', () => {
  it('no renderiza nada mientras carga', () => {
    const { container } = render(
      <PendingReservationsAlert count={2} loading canApprove />
    );
    expect(container.firstChild).toBeNull();
  });

  it('no renderiza nada si no hay pendientes', () => {
    const { container } = render(
      <PendingReservationsAlert count={0} loading={false} canApprove />
    );
    expect(container.firstChild).toBeNull();
  });

  it('con permiso de aprobar muestra el mensaje y el botón', () => {
    render(<PendingReservationsAlert count={2} loading={false} canApprove />);
    expect(screen.getByText(/Tienes 2 reservas pendientes de aprobación/)).toBeInTheDocument();
    expect(screen.getByText('Revisar ahora')).toBeInTheDocument();
  });

  it('sin permiso de aprobar habla de solicitudes y no ofrece botón', () => {
    render(<PendingReservationsAlert count={2} loading={false} canApprove={false} />);
    expect(screen.getByText(/Tienes 2 solicitudes pendientes de aprobación/)).toBeInTheDocument();
    expect(screen.queryByText('Revisar ahora')).not.toBeInTheDocument();
  });

  it('usa singular cuando hay una sola pendiente', () => {
    render(<PendingReservationsAlert count={1} loading={false} canApprove />);
    expect(screen.getByText('Tienes 1 reserva pendiente de aprobación')).toBeInTheDocument();
  });
});
