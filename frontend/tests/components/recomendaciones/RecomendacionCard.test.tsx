import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecomendacionCard } from '@/components/recomendaciones/RecomendacionCard';

const baseRec = {
  id: 1,
  puntaje: 0.85,
  razon: 'Espacio recomendado por afinidad',
  tipoRecomendacion: 'ESPACIO',
} as never;

describe('RecomendacionCard', () => {
  it('muestra el porcentaje y razón', () => {
    render(<RecomendacionCard recomendacion={baseRec} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Espacio recomendado por afinidad')).toBeInTheDocument();
  });

  it('llama a onSelect al hacer click', async () => {
    const onSelect = vi.fn();
    render(<RecomendacionCard recomendacion={baseRec} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Recomendación'));
    expect(onSelect).toHaveBeenCalled();
  });
});
