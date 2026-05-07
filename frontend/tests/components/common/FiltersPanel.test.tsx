import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiltersPanel, type FilterField } from '@/components/common/FiltersPanel';

describe('FiltersPanel', () => {
  it('renderiza un input de texto y dispara onChange', async () => {
    const onChange = vi.fn();
    const fields: FilterField[] = [
      { id: 'q', label: 'Buscar', type: 'input', value: '', onChange },
    ];
    render(<FiltersPanel showFilters fields={fields} />);
    await userEvent.type(screen.getByLabelText('Buscar'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('renderiza un campo select con sus opciones', () => {
    const fields: FilterField[] = [
      {
        id: 'estado',
        label: 'Estado',
        type: 'select',
        value: 'all',
        options: [{ value: 'all', label: 'Todos' }, { value: 'a', label: 'Activo' }],
        onChange: vi.fn(),
      },
    ];
    render(<FiltersPanel showFilters fields={fields} />);
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  it('renderiza contenido adicional cuando showFilters es true', () => {
    render(
      <FiltersPanel
        showFilters
        fields={[]}
        additionalContent={<div>extra</div>}
      />
    );
    expect(screen.getByText('extra')).toBeInTheDocument();
  });
});
