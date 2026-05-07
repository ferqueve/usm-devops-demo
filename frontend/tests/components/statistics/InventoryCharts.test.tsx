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
    Legend: Stub,
    ComposedChart: Stub,
  };
});

import InventoryCharts from '@/components/statistics/InventoryCharts';

const baseStats = {
  totalItems: 0,
  disponibles: 5,
  mantenimiento: 2,
  danados: 1,
  sinAsignar: 0,
  topEspacios: [],
  topTipos: [],
  itemsPorTipo: [],
} as never;

describe('InventoryCharts', () => {
  it('skeleton en loading', () => {
    const { container } = render(<InventoryCharts stats={baseStats} loading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renderiza titulos de graficos con stats', () => {
    render(<InventoryCharts stats={baseStats} />);
    // Al menos un titulo de gráfico debería aparecer
    expect(screen.getByText('Distribución por Estado')).toBeInTheDocument();
  });
});
