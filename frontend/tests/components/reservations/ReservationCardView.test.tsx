import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Reserva } from '@/lib/types/spaces';

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

import ReservationCardView from '@/components/reservations/ReservationCardView';

function makeReserva(overrides: Partial<Reserva> = {}): Reserva {
  return {
    id: 1,
    espacioId: 10,
    espacioNombre: 'Sala A',
    capacidadEspacio: 20,
    titulo: 'Mi reserva',
    usuarioId: 5,
    usuarioNombre: 'Ana',
    usuarioEmail: 'ana@x.com',
    inicio: new Date(Date.now() + 3600_000).toISOString(),
    fin: new Date(Date.now() + 7200_000).toISOString(),
    estado: 'APROBADO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const baseProps = {
  reservas: [],
  espaciosUnicos: [],
  carrerasUnicas: [],
  tiposEspacioUnicos: [],
  tiempoFilter: 'todas',
  estadoFilter: 'todas',
  espacioFilter: null,
  carreraFilter: null,
  tipoEspacioFilter: null,
  fechaInicio: undefined,
  fechaFin: undefined,
  viewMode: 'cards' as const,
  hayFiltrosActivos: false,
  onTiempoFilterChange: vi.fn(),
  onEstadoFilterChange: vi.fn(),
  onEspacioFilterChange: vi.fn(),
  onCarreraFilterChange: vi.fn(),
  onTipoEspacioFilterChange: vi.fn(),
  onFechaInicioChange: vi.fn(),
  onFechaFinChange: vi.fn(),
  onViewModeChange: vi.fn(),
  onClearFilters: vi.fn(),
  onCreateReserva: vi.fn(),
  onViewDetails: vi.fn(),
  onCancelReserva: vi.fn(),
};

function renderView(props = {}) {
  return render(
    <TooltipProvider>
      <ReservationCardView {...baseProps} {...props} />
    </TooltipProvider>
  );
}

describe('ReservationCardView', () => {
  it('muestra empty state cuando no hay reservas', () => {
    renderView();
    expect(screen.getByText(/No hay reservas/i)).toBeInTheDocument();
  });

  it('renderiza tarjeta con título de reserva', () => {
    renderView({ reservas: [makeReserva({ titulo: 'Demo' })] });
    expect(screen.getByText('Demo')).toBeInTheDocument();
  });

  it('muestra overlay de carga cuando loading=true', () => {
    renderView({ loading: true });
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });
});
