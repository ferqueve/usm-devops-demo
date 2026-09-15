import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarChart3, Users } from 'lucide-react';
import { IndiceSecciones } from '@/components/statistics/Seccion';

const SECCIONES = [
  { id: 'resumen', titulo: 'Resumen', icono: BarChart3, color: '#184897' },
  { id: 'quien', titulo: 'Quién reserva', icono: Users, color: '#DE7A27' },
];

describe('IndiceSecciones', () => {
  it('lleva los filtros aplicados dentro de la barra fija', () => {
    // Envueltos juntos en otro div, la barra quedaba presa de ese div y dejaba de ser fija.
    render(<IndiceSecciones secciones={SECCIONES} debajo={<span>Filtrando por Edificio A</span>} />);

    const barra = screen.getByRole('navigation', { name: 'Secciones' }).closest('.sticky');
    expect(barra).not.toBeNull();
    expect(barra).toContainElement(screen.getByText('Filtrando por Edificio A'));
  });

  it('sin filtros aplicados no dibuja la fila de abajo', () => {
    const { container } = render(<IndiceSecciones secciones={SECCIONES} />);
    expect(container.querySelector('.sticky > .border-t')).toBeNull();
  });

  it('sin scroll marca la primera sección y muestra sus controles', () => {
    // Con la página corta (cargando) se marcaba la última y se escondían los filtros.
    render(<IndiceSecciones secciones={SECCIONES} extra={<button type="button">Filtros</button>} extraEn={['resumen']} />);
    expect(screen.getByRole('link', { name: 'Resumen' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument();
  });

  it('muestra los controles sólo en las secciones indicadas', () => {
    render(<IndiceSecciones secciones={SECCIONES} extra={<button type="button">Filtros</button>} extraEn={['otra']} />);
    expect(screen.queryByRole('button', { name: 'Filtros' })).toBeNull();
  });
});
