import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/api/reservations', () => ({
  reservationsApi: {
    obtenerEstadisticasPersonales: vi.fn().mockResolvedValue({ data: null }),
  },
}));
vi.mock('@/lib/api/spaces', () => ({
  espaciosApi: { obtenerEspacios: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock('@/lib/api/carreras', () => ({
  carrerasApi: { obtenerCarreras: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock('@/components/auth/PermissionGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/statistics/ReservationCharts', () => ({
  default: () => <div data-testid="charts" />,
}));
vi.mock('@/lib/utils/pdf-export', () => ({ exportReservationStatsToPDF: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import ReservationStatsAnalista from '@/components/statistics/ReservationStatsAnalista';

describe('ReservationStatsAnalista', () => {
  it('muestra mensaje de error cuando no hay stats', async () => {
    render(<ReservationStatsAnalista />);
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar estadísticas/i)).toBeInTheDocument();
    });
  });
});
