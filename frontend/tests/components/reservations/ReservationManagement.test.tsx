import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, nombre: 'Ana', email: 'a@x.com', rolApp: 'ANALISTA' } }),
}));

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

vi.mock('@/hooks/usePreferences', () => ({
  usePreferences: () => ({ preferencias: null, updatePreferencias: vi.fn() }),
}));

vi.mock('@/hooks/useEspacios', () => ({
  useEspacios: () => ({ espacios: [], loading: false }),
}));

vi.mock('@/hooks/useCarreras', () => ({
  useCarreras: () => ({ carreras: [], loading: false }),
}));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('@/lib/api/reservations', () => ({
  reservationsApi: {
    obtenerMisReservas: vi.fn().mockResolvedValue({ data: [] }),
    obtenerMisReservasPaged: vi.fn().mockResolvedValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
    }),
    obtenerTodasLasReservas: vi.fn().mockResolvedValue({ data: [] }),
    obtenerTodasReservasPaged: vi.fn().mockResolvedValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
    }),
    cambiarEstadoReserva: vi.fn(),
    obtenerEstadisticasPersonales: vi.fn().mockResolvedValue({
      data: null,
    }),
  },
}));

vi.mock('@/lib/api/spaces', () => ({
  espaciosApi: {
    obtenerEspacios: vi.fn().mockResolvedValue({ data: [] }),
    listarTiposEspacio: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/lib/api/recomendaciones', () => ({
  recomendacionesApi: {
    obtenerReservasPrioritarias: vi.fn().mockResolvedValue({ success: true, data: [] }),
    obtenerRecomendacionesDashboard: vi.fn().mockResolvedValue({
      success: true,
      data: { espaciosRecomendados: [], itemsRecomendados: [], mantenimientoUrgente: [], reservasPrioritarias: [], totalRecomendaciones: 0 },
    }),
  },
}));

// Mock subcomponentes pesados con stubs simples
vi.mock('@/components/reservations/ReservationCalendarView', () => ({
  default: () => <div data-testid="calendar-view">Calendar</div>,
}));
vi.mock('@/components/reservations/ReservationCardView', () => ({
  default: () => <div data-testid="card-view">Cards</div>,
}));
vi.mock('@/components/reservations/ReservationTableView', () => ({
  default: () => <div data-testid="table-view">Table</div>,
}));
vi.mock('@/components/reservations/ReservationFormDialog', () => ({
  default: () => null,
}));
vi.mock('@/components/reservations/ReservationDetailsDialog', () => ({
  default: () => null,
}));
vi.mock('@/components/reservations/ReservationStats', () => ({
  default: () => <div data-testid="stats">Stats</div>,
}));
vi.mock('@/components/reservations/ReservationPendientes', () => ({
  default: () => <div data-testid="pendientes">Pendientes</div>,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import ReservationManagement from '@/components/reservations/ReservationManagement';

describe('ReservationManagement', () => {
  it('renderiza sin errores', () => {
    const { container } = render(<ReservationManagement />);
    expect(container).toBeTruthy();
  });
});
