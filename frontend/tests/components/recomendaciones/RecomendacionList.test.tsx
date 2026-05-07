import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecomendacionList } from '@/components/recomendaciones/RecomendacionList';

describe('RecomendacionList', () => {
  it('muestra spinner cuando loading', () => {
    const { container } = render(<RecomendacionList recomendaciones={[]} loading />);
    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('muestra mensaje de vacío cuando no hay recomendaciones', () => {
    render(<RecomendacionList recomendaciones={[]} emptyMessage="vacío" />);
    expect(screen.getByText('vacío')).toBeInTheDocument();
  });

  it('renderiza recomendaciones limitadas por maxItems', () => {
    const recs = [
      { id: 1, puntaje: 0.5, razon: 'a' },
      { id: 2, puntaje: 0.6, razon: 'b' },
      { id: 3, puntaje: 0.7, razon: 'c' },
    ] as never[];
    render(<RecomendacionList recomendaciones={recs} maxItems={2} />);
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.queryByText('c')).not.toBeInTheDocument();
  });
});
