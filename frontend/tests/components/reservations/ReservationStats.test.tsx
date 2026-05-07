import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/api/reservations', () => ({
  reservationsApi: {
    obtenerEstadisticasPersonales: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import ReservationStats from '@/components/reservations/ReservationStats';
import { reservationsApi } from '@/lib/api/reservations';

const sampleStats = {
  totalReservas: 10,
  totalAprobadas: 5,
  totalPendientes: 2,
  totalCanceladas: 1,
  totalFuturas: 3,
  totalPasadas: 7,
  totalActivas: 4,
  reservasPorEstado: {},
  reservasEsteMes: 2,
  reservasProximoMes: 1,
  reservasEsteAnio: 8,
  reservasPorMes: {},
  reservasPorDiaSemana: {},
  promedioReservasPorMes: 2.5,
  totalEspaciosUsados: 4,
  reservasPorEspacio: {},
  distribucionPorEspacio: {},
  duracionTotalHoras: 25,
  duracionPromedioHoras: 2.5,
  reservaMasLargaHoras: 4,
  reservaMasCortaHoras: 1,
  horasReservadasEsteMes: 6,
  promedioReservasPorSemana: 1.2,
  diasDesdeUltimaReserva: 3,
  diasHastaProximaReserva: 5,
  reservasMesActual: 2,
  reservasMesAnterior: 3,
  diferenciaMesAnterior: -1,
  porcentajeCambioMesAnterior: -33,
};

describe('ReservationStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra skeleton mientras carga', () => {
    vi.mocked(reservationsApi.obtenerEstadisticasPersonales).mockImplementation(
      () => new Promise(() => {})
    );
    const { container } = render(<ReservationStats />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('muestra estadísticas cuando carga exitosamente', async () => {
    vi.mocked(reservationsApi.obtenerEstadisticasPersonales).mockResolvedValue({
      data: sampleStats,
    } as never);
    render(<ReservationStats />);
    await waitFor(() => {
      expect(screen.getByText('Estadísticas')).toBeInTheDocument();
    });
    expect(screen.getByText('Total Reservas')).toBeInTheDocument();
  });

  it('muestra mensaje de error si falla la API y no devuelve data', async () => {
    vi.mocked(reservationsApi.obtenerEstadisticasPersonales).mockResolvedValue({
      data: null,
    } as never);
    render(<ReservationStats />);
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar estadísticas/i)).toBeInTheDocument();
    });
  });

  it('renderiza modo horizontal con la métrica Total', async () => {
    vi.mocked(reservationsApi.obtenerEstadisticasPersonales).mockResolvedValue({
      data: sampleStats,
    } as never);
    render(<ReservationStats horizontal />);
    await waitFor(() => {
      expect(screen.getByText('Total Reservas')).toBeInTheDocument();
    });
  });
});
