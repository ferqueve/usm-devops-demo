import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EspacioCell } from '@/components/inventory/_shared/EspacioCell';

describe('EspacioCell', () => {
  it('muestra "Sin asignar" cuando no hay espacio (variant table)', () => {
    render(<EspacioCell item={{ espacioId: null, espacioNombre: '' }} />);
    expect(screen.getByText('Sin asignar')).toBeInTheDocument();
  });

  it('muestra "Sin asignar" con font-medium en variant card', () => {
    render(<EspacioCell variant="card" item={{ espacioId: null, espacioNombre: '' }} />);
    const el = screen.getByText('Sin asignar');
    expect(el.className).toContain('font-medium');
  });

  it('renderiza el badge con color cuando hay espacioColor', () => {
    render(
      <EspacioCell item={{ espacioId: 1, espacioNombre: 'Aula 1', espacioColor: '#ff0000' }} />
    );
    const el = screen.getByText('Aula 1');
    expect(el).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('renderiza nombre sin color en variant card', () => {
    render(
      <EspacioCell variant="card" item={{ espacioId: 1, espacioNombre: 'Lab', espacioColor: undefined }} />
    );
    const el = screen.getByText('Lab');
    expect(el.className).toContain('font-medium');
  });
});
