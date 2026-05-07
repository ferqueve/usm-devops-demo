import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EstadoBadge } from '@/components/inventory/_shared/inventoryEstado';

describe('EstadoBadge', () => {
  it('renderiza estado DISPONIBLE con label correcto', () => {
    render(<EstadoBadge estado="DISPONIBLE" />);
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });

  it('renderiza estado MANTENIMIENTO con label correcto', () => {
    render(<EstadoBadge estado="MANTENIMIENTO" />);
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
  });

  it('renderiza estado desconocido usando el valor crudo como label', () => {
    render(<EstadoBadge estado="DESCONOCIDO" />);
    expect(screen.getByText('DESCONOCIDO')).toBeInTheDocument();
  });
});
