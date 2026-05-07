import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SpaceStatsWidget from '@/components/dashboard/widgets/SpaceStatsWidget';

describe('SpaceStatsWidget', () => {
  it('renderiza items con stats', () => {
    const stats = { totalEspacios: 5, disponibles: 3, enMantenimiento: 1, ocupados: 1 };
    render(<SpaceStatsWidget stats={stats} loading={false} />);
    expect(screen.getByText('Total Espacios')).toBeInTheDocument();
    expect(screen.getByText('Disponibles')).toBeInTheDocument();
    expect(screen.getByText('Ocupados')).toBeInTheDocument();
  });

  it('muestra skeleton si loading', () => {
    const { container } = render(<SpaceStatsWidget stats={null} loading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
