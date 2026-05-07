import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryStatsWidget from '@/components/dashboard/widgets/InventoryStatsWidget';

const stats = {
  totalItems: 10,
  disponibles: 6,
  mantenimiento: 2,
  danados: 1,
  asignados: 8,
  sinAsignar: 2,
} as never;

describe('InventoryStatsWidget', () => {
  it('muestra skeleton en loading', () => {
    const { container } = render(<InventoryStatsWidget stats={null} loading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renderiza items con stats', () => {
    render(<InventoryStatsWidget stats={stats} loading={false} />);
    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('Disponibles')).toBeInTheDocument();
    expect(screen.getByText('Dañados')).toBeInTheDocument();
  });
});
