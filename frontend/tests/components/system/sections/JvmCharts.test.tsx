import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/ui/metrics-chart', () => ({
  MetricsChart: ({ title }: { title: string }) => <div data-testid="chart">{title}</div>,
}));

import { JvmCharts } from '@/components/system/sections/JvmCharts';

describe('JvmCharts', () => {
  it('renderiza tres charts', () => {
    render(<JvmCharts metricsHistory={[]} />);
    const charts = screen.getAllByTestId('chart');
    expect(charts.length).toBe(3);
    expect(screen.getByText('Memoria')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('Threads')).toBeInTheDocument();
  });
});
