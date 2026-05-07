import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/utils/date-helpers', () => ({
  formatDate: () => '2026-01-01',
  formatRelativeTime: () => 'hace 1 día',
}));

import InventoryDetailsDialog from '@/components/inventory/InventoryDetailsDialog';

const item = {
  id: 42,
  tipoElementoNombre: 'Mesa',
  cantidad: 4,
  estado: 'DISPONIBLE',
  espacioNombre: 'Aula 1',
  observaciones: 'En buen estado',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-02',
} as never;

describe('InventoryDetailsDialog', () => {
  it('no renderiza nada cuando item es null', () => {
    const { container } = render(
      <InventoryDetailsDialog item={null} open onOpenChange={vi.fn()} />
    );
    expect(container.textContent).toBe('');
  });

  it('renderiza información del item', () => {
    render(<InventoryDetailsDialog item={item} open onOpenChange={vi.fn()} />);
    expect(screen.getByText('Mesa')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Aula 1')).toBeInTheDocument();
    expect(screen.getByText('En buen estado')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });
});
