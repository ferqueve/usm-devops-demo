import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Reserva } from '@/lib/types/spaces';

vi.mock('@/lib/api/recomendaciones', () => ({
  recomendacionesApi: {
    obtenerReservasPrioritarias: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

import ReservationPendientes from '@/components/reservations/ReservationPendientes';

function makeReserva(overrides: Partial<Reserva> = {}): Reserva {
  return {
    id: 1,
    espacioId: 10,
    espacioNombre: 'Sala A',
    capacidadEspacio: 20,
    titulo: 'Solicitud',
    usuarioId: 5,
    usuarioNombre: 'Ana',
    usuarioEmail: 'ana@x.com',
    inicio: new Date(Date.now() + 3600_000).toISOString(),
    fin: new Date(Date.now() + 7200_000).toISOString(),
    estado: 'PENDIENTE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ReservationPendientes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra estado vacío cuando no hay reservas pendientes', () => {
    render(
      <ReservationPendientes
        reservasPendientes={[]}
        loading={false}
        onViewDetails={vi.fn()}
        collapsed={false}
        onCollapsedChange={vi.fn()}
      />
    );
    expect(screen.getByText(/No hay solicitudes pendientes/i)).toBeInTheDocument();
  });

  it('muestra estado de carga cuando loading=true', () => {
    render(
      <ReservationPendientes
        reservasPendientes={[]}
        loading={true}
        onViewDetails={vi.fn()}
        collapsed={false}
        onCollapsedChange={vi.fn()}
      />
    );
    expect(screen.getByText(/Cargando solicitudes/i)).toBeInTheDocument();
  });

  it('muestra reservas pendientes con título', async () => {
    render(
      <ReservationPendientes
        reservasPendientes={[makeReserva({ titulo: 'Mi solicitud' })]}
        loading={false}
        onViewDetails={vi.fn()}
        collapsed={false}
        onCollapsedChange={vi.fn()}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('Mi solicitud')).toBeInTheDocument();
    });
  });
});
