import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

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
  };
});

describe('DashboardCharts', () => {
  it('renderiza skeletons en loading', () => {
    const { container } = render(<DashboardCharts reservas={[]} loading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('muestra estado vacio sin reservas', () => {
    render(<DashboardCharts reservas={[]} />);
    expect(screen.getAllByText('No hay datos para mostrar').length).toBeGreaterThan(0);
  });

  it('renderiza cards con datos cuando hay reservas', () => {
    const reservas = [
      { id: 1, inicio: '2026-01-05T10:00:00', fin: '2026-01-05T11:00:00', estado: 'APROBADO', espacioNombre: 'A' },
      { id: 2, inicio: '2026-01-06T10:00:00', fin: '2026-01-06T11:00:00', estado: 'PENDIENTE', espacioNombre: 'B' },
    ] as never;
    render(<DashboardCharts reservas={reservas} />);
    expect(screen.getByText('Reservas por Estado')).toBeInTheDocument();
  });
});
