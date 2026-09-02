import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryStatsCards from '@/components/inventory/InventoryStatsCards';

describe('InventoryStatsCards', () => {
  it('renderiza las seis celdas en cero cuando no hay estadísticas', () => {
    render(<InventoryStatsCards statistics={null} />);
    for (const label of ['Total de items', 'Disponibles', 'Mantenimiento', 'Dañados', 'Sin asignar', 'Asignados']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('Todos asignados')).toBeInTheDocument();
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
  });

  it('muestra los valores y sus porcentajes sobre el total', () => {
    render(
      <InventoryStatsCards
        statistics={{ totalItems: 10, disponibles: 6, mantenimiento: 2, danados: 2, sinAsignar: 3 }}
      />
    );
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getAllByText('20%')).toHaveLength(2); // mantenimiento y dañados
    expect(screen.getByText('Requieren asignación')).toBeInTheDocument();
  });

  it('deriva los asignados restando los sin asignar al total', () => {
    render(
      <InventoryStatsCards
        statistics={{ totalItems: 10, disponibles: 6, mantenimiento: 2, danados: 2, sinAsignar: 3 }}
      />
    );
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });
});
