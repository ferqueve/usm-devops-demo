import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PriorityReservationsWidget from '@/components/dashboard/widgets/PriorityReservationsWidget';

const recs = [
  {
    id: 1,
    razon: 'Urgente Reserva #42',
    espacioNombre: 'Aula 101',
    urgencia: 8,
    inicio: '2026-01-01T10:00:00',
    fin: '2026-01-01T11:00:00',
  },
] as never;

describe('PriorityReservationsWidget', () => {
  it('no renderiza si !canApprove', () => {
    const { container } = render(
      <PriorityReservationsWidget
        reservasPrioritarias={recs}
        reservasPendientes={[]}
        loading={false}
        canApprove={false}
        onViewDetails={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('no renderiza si loading', () => {
    const { container } = render(
      <PriorityReservationsWidget
        reservasPrioritarias={recs}
        reservasPendientes={[]}
        loading
        canApprove
        onViewDetails={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza prioritarias con boton de reserva inferida', async () => {
    const reservasPendientes = [{ id: 42 }] as never;
    const onViewDetails = vi.fn();
    render(
      <PriorityReservationsWidget
        reservasPrioritarias={recs}
        reservasPendientes={reservasPendientes}
        loading={false}
        canApprove
        onViewDetails={onViewDetails}
      />
    );
    expect(screen.getByText('Reservas Prioritarias')).toBeInTheDocument();
    const btn = screen.getByText('Reserva #42');
    await userEvent.click(btn);
    expect(onViewDetails).toHaveBeenCalled();
  });
});
