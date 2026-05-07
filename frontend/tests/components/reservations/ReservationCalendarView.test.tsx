import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

vi.mock('@/hooks/usePreferences', () => ({
  usePreferences: () => ({ preferencias: null }),
}));

import ReservationCalendarView from '@/components/reservations/ReservationCalendarView';

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
  viewMode: 'calendar' as const,
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
  onViewDetails: vi.fn(),
  onCancelReserva: vi.fn(),
};

function renderView(props = {}) {
  return render(
    <TooltipProvider>
      <ReservationCalendarView {...baseProps} {...props} />
    </TooltipProvider>
  );
}

describe('ReservationCalendarView', () => {
  it('renderiza controles de navegación (Hoy, Día, Semana, Mes)', () => {
    renderView();
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Día')).toBeInTheDocument();
    expect(screen.getByText('Semana')).toBeInTheDocument();
    expect(screen.getByText('Mes')).toBeInTheDocument();
  });

  it('renderiza sin errores con reservas vacías', () => {
    const { container } = renderView();
    expect(container).toBeTruthy();
  });
});
