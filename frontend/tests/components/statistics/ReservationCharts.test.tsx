import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('recharts', () => {
  const Stub = ({ children }: { children?: React.ReactNode }) => <div data-testid="chart">{children}</div>;
  return {
    ResponsiveContainer: Stub,
    PieChart: Stub,
    Pie: Stub,
    Cell: Stub,
    BarChart: Stub,
    Bar: Stub,
    XAxis: Stub,
    YAxis: Stub,
    CartesianGrid: Stub,
    Tooltip: Stub,
    LineChart: Stub,
    Line: Stub,
  };
});

import ReservationCharts from '@/components/statistics/ReservationCharts';

describe('ReservationCharts', () => {
  it('no renderiza nada cuando todas las series estan vacias', () => {
    const { container } = render(
      <ReservationCharts
        reservasPorMesData={[]}
        reservasPorDiaSemanaData={[]}
        reservasPorEspacioData={[]}
        distribucionPorEstadoData={[]}
      />
    );
    expect(container.querySelector('[data-testid="chart"]')).toBeNull();
  });

  it('renderiza titulo cuando hay distribucion por estado', () => {
    render(
      <ReservationCharts
        reservasPorMesData={[]}
        reservasPorDiaSemanaData={[]}
        reservasPorEspacioData={[]}
        distribucionPorEstadoData={[{ name: 'A', value: 1, color: '#000' }]}
      />
    );
    expect(screen.getByText('Distribución por estado')).toBeInTheDocument();
    expect(screen.queryByText('Tendencia mensual')).not.toBeInTheDocument();
  });

  it('renderiza cada sección sólo si su serie tiene datos', () => {
    render(
      <ReservationCharts
        reservasPorMesData={[{ name: 'Ene', reservas: 3 }] as never}
        reservasPorDiaSemanaData={[{ name: 'Lunes', reservas: 2 }] as never}
        reservasPorEspacioData={[]}
        distribucionPorEstadoData={[]}
      />
    );
    expect(screen.getByText('Tendencia mensual')).toBeInTheDocument();
    expect(screen.getByText('Reservas por día de semana')).toBeInTheDocument();
    expect(screen.queryByText('Distribución por estado')).not.toBeInTheDocument();
  });
});
