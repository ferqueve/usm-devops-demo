import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PanelEstadistica } from '@/components/statistics/PanelEstadistica';

const explicacion = {
  que: 'Qué muestra este gráfico.',
  como: 'Cómo se calcula el número.',
  lectura: 'Cómo leerlo.',
  ojo: 'Un límite del dato.',
  fuente: 'noche' as const,
};

function montar() {
  return render(
    <MemoryRouter>
      <PanelEstadistica title="Ocupación" count="13 espacios" explicacion={explicacion}>
        {(grande) => <div>{grande ? 'versión grande' : 'versión chica'}</div>}
      </PanelEstadistica>
    </MemoryRouter>,
  );
}

describe('PanelEstadistica', () => {
  it('muestra la versión chica en el panel', () => {
    montar();
    expect(screen.getByText('versión chica')).toBeInTheDocument();
    expect(screen.queryByText('versión grande')).not.toBeInTheDocument();
  });

  it('abre la estadística en grande con su explicación y la fuente del dato', () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'Ampliar y explicar: Ocupación' }));

    const dialogo = screen.getByRole('dialog');
    expect(dialogo).toHaveTextContent('versión grande');
    expect(dialogo).toHaveTextContent('Cómo se calcula el número.');
    expect(dialogo).toHaveTextContent('Cómo leerlo.');
    expect(dialogo).toHaveTextContent('Un límite del dato.');
    expect(dialogo).toHaveTextContent('Hasta anoche');
  });
});

