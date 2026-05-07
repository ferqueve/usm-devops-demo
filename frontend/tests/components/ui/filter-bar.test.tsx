import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar, type FilterItem } from '@/components/ui/filter-bar';

function makeFilter(id: string, label: string, onRemove = vi.fn()): FilterItem {
  return { id, label, value: id, onRemove };
}

describe('FilterBar', () => {
  it('no renderiza nada si filters vacío', () => {
    const { container } = render(<FilterBar filters={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza un filtro y dispara onRemove', async () => {
    const onRemove = vi.fn();
    const filters = [makeFilter('a', 'Edificio A', onRemove)];
    render(<FilterBar filters={filters} />);
    expect(screen.getByText('Edificio A')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Quitar filtro Edificio A'));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('muestra "Limpiar todo" sólo con más de 1 filtro y onClearAll', async () => {
    const onClearAll = vi.fn();
    const filters = [makeFilter('a', 'A'), makeFilter('b', 'B')];
    render(<FilterBar filters={filters} onClearAll={onClearAll} />);
    const btn = screen.getByRole('button', { name: 'Limpiar todo' });
    await userEvent.click(btn);
    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it('no muestra "Limpiar todo" con 1 sólo filtro', () => {
    const filters = [makeFilter('a', 'A')];
    render(<FilterBar filters={filters} onClearAll={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Limpiar todo' })).toBeNull();
  });
});
