import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryStatsCards from '@/components/inventory/InventoryStatsCards';

describe('InventoryStatsCards', () => {
  it('renderiza ceros cuando statistics es null', () => {
    render(<InventoryStatsCards statistics={null} />);
    expect(screen.getByText('Total de Items')).toBeInTheDocument();
    expect(screen.getByText('Todos asignados')).toBeInTheDocument();
  });

  it('renderiza valores numéricos correctamente', () => {
    render(
      <InventoryStatsCards
        statistics={{
          totalItems: 10,
          disponibles: 6,
          mantenimiento: 2,
          danados: 2,
          sinAsignar: 3,
        }}
      />
    );
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('6 disponibles')).toBeInTheDocument();
    expect(screen.getByText('Requieren asignación')).toBeInTheDocument();
  });
});
