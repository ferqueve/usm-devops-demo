import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecomendacionPanel } from '@/components/recomendaciones/RecomendacionPanel';

describe('RecomendacionPanel', () => {
  it('muestra título y conteo cuando hay recomendaciones', () => {
    const recs = [{ id: 1, puntaje: 0.7, razon: 'r1' }] as never[];
    render(<RecomendacionPanel title="Top" recomendaciones={recs} />);
    expect(screen.getByText('Top')).toBeInTheDocument();
    expect(screen.getByText('1 recomendaciones')).toBeInTheDocument();
  });

  it('no muestra el contador cuando lista vacía', () => {
    render(<RecomendacionPanel title="Top" recomendaciones={[]} emptyMessage="ninguna" />);
    expect(screen.queryByText(/recomendaciones$/)).not.toBeInTheDocument();
    expect(screen.getByText('ninguna')).toBeInTheDocument();
  });
});
