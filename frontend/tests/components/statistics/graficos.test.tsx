import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));

import { Waffle } from '@/components/statistics/graficos/Waffle';
import { Medidor } from '@/components/statistics/graficos/Medidor';
import { CalendarioCalor } from '@/components/statistics/graficos/CalendarioCalor';
import { SERIE_CLARO } from '@/lib/design/paleta';

describe('Waffle', () => {
  it('reparte exactamente cien cuadros aunque los porcentajes no sean enteros', () => {
    const { container } = render(
      <Waffle grupos={[
        { nombre: 'A', valor: 1, color: '#111111' },
        { nombre: 'B', valor: 1, color: '#222222' },
        { nombre: 'C', valor: 1, color: '#333333' },
      ]} />,
    );
    const cuadros = container.querySelectorAll('[role="img"] > span');
    expect(cuadros).toHaveLength(100);
    const porColor = (c: string) => [...cuadros].filter((e) => (e as HTMLElement).title === c).length;
    expect(porColor('A') + porColor('B') + porColor('C')).toBe(100);
    expect(Math.max(porColor('A'), porColor('B'), porColor('C')) - Math.min(porColor('A'), porColor('B'), porColor('C'))).toBeLessThanOrEqual(1);
  });

  it('sin datos no dibuja cuadros', () => {
    render(<Waffle grupos={[{ nombre: 'A', valor: 0, color: '#111' }]} />);
    expect(screen.getByText('Sin datos.')).toBeInTheDocument();
  });
});

describe('Medidor', () => {
  it('escribe el valor y pinta como alerta cuando más es peor y se pasa del umbral', () => {
    const { container } = render(<Medidor valor={45} etiqueta="Sin respuesta" umbrales={{ alerta: 30, aviso: 10 }} masEsPeor />);
    expect(screen.getByRole('img', { name: 'Sin respuesta: 45%' })).toBeInTheDocument();
    // Contra la paleta y no contra un hex escrito acá: cuando los colores de
    // marca se unificaron en lib/design/paleta, este test se cayó por asertar
    // el valor viejo aunque el comportamiento —pintar de rojo— no había
    // cambiado. Anclado a la fuente, sigue verificando lo que importa.
    const arco = container.querySelectorAll('path')[1];
    expect(arco.getAttribute('stroke')).toBe(SERIE_CLARO.rojo);
  });

  it('un valor alto donde más es mejor queda en verde', () => {
    const { container } = render(<Medidor valor={92} etiqueta="Se aprueban" umbrales={{ alerta: 60, aviso: 80 }} />);
    expect(container.querySelectorAll('path')[1].getAttribute('stroke')).toBe(SERIE_CLARO.verde);
  });
});

describe('CalendarioCalor', () => {
  it('dibuja un cuadrado por día y marca el día con más', () => {
    const dias = Array.from({ length: 14 }, (_, i) => ({ fecha: `2026-09-${String(i + 1).padStart(2, '0')}`, valor: i === 6 ? 40 : 5 }));
    render(<CalendarioCalor dias={dias} unidad="reservas" />);
    expect(screen.getAllByTitle(/reservas$/)).toHaveLength(14);
    expect(screen.getByText(/en 14 días/)).toBeInTheDocument();
    expect(screen.getByText(/7 sept|7 set/i)).toBeInTheDocument();
  });
});

import { fireEvent } from '@testing-library/react';
import { Embudo } from '@/components/statistics/graficos/Embudo';
import { BarrasTramos } from '@/components/statistics/graficos/BarrasTramos';
import { Apiladas100 } from '@/components/statistics/graficos/Apiladas100';
import { MatrizCalor } from '@/components/statistics/graficos/MatrizCalor';
import { Mancuernas } from '@/components/statistics/graficos/Mancuernas';

describe('Embudo', () => {
  it('dice qué parte de cada etapa pasa a la siguiente', () => {
    render(<Embudo etapas={[{ nombre: 'Pedidas', valor: 200, color: '#000' }, { nombre: 'Resueltas', valor: 50, color: '#111' }]} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});

describe('BarrasTramos', () => {
  it('escribe el total y el porcentaje de cada tramo, y la leyenda si hay segmentos', () => {
    render(
      <BarrasTramos
        tramos={[
          { etiqueta: '< 24 h', segmentos: [{ nombre: 'A tiempo', valor: 3, color: '#0f0' }, { nombre: 'Vencidas', valor: 1, color: '#f00' }] },
          { etiqueta: '> 7 días', segmentos: [{ nombre: 'A tiempo', valor: 0, color: '#0f0' }, { nombre: 'Vencidas', valor: 4, color: '#f00' }] },
        ]}
      />,
    );
    expect(screen.getAllByText('4')).toHaveLength(2);
    expect(screen.getAllByText('50%')).toHaveLength(2);
    expect(screen.getByText('Vencidas')).toBeInTheDocument();
  });

  it('sin datos lo dice', () => {
    render(<BarrasTramos tramos={[{ etiqueta: 'x', segmentos: [{ nombre: 'a', valor: 0, color: '#000' }] }]} />);
    expect(screen.getByText('Sin datos en el período.')).toBeInTheDocument();
  });
});

describe('Apiladas100', () => {
  it('reparte cada fila en porcentajes y muestra el total', () => {
    render(<Apiladas100 filas={[{ etiqueta: 'Mismo día', segmentos: [{ nombre: 'Aprobadas', valor: 3, color: '#0f0' }, { nombre: 'Canceladas', valor: 1, color: '#f00' }] }]} />);
    expect(screen.getByTitle('Mismo día · Aprobadas: 3 (75%)')).toHaveTextContent('75%');
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});

describe('MatrizCalor', () => {
  it('marca las celdas con horas llenas', () => {
    render(<MatrizCalor filas={['Lab']} columnas={[8, 9]} celdas={[{ fila: 'Lab', columna: 8, valor: 90, marca: 2 }]} etiquetaMarca="horas llenas" />);
    expect(screen.getByTitle('Lab · 8: 90% · 2 horas llenas')).toHaveTextContent('90');
  });
});

describe('Mancuernas', () => {
  it('pone los dos valores de cada fila', () => {
    render(<Mancuernas filas={[{ clave: 1, nombre: 'Cálculo', a: 30, b: 50 }]} nombreA="Asistieron" nombreB="Agendadas" colorA="#0f0" colorB="#00f" />);
    expect(screen.getByTitle('Asistieron: 30 · Agendadas: 50')).toBeInTheDocument();
  });
});

describe('Dona con clic', () => {
  it('el renglón de la leyenda filtra', async () => {
    const { Dona } = await import('@/components/statistics/graficos/Dona');
    const alClic = vi.fn();
    render(<Dona porciones={[{ nombre: 'Edificio A', valor: 3, color: '#000', alClic }]} />);
    fireEvent.click(screen.getByTitle('Filtrar por Edificio A'));
    expect(alClic).toHaveBeenCalled();
  });
});

describe('Mancuernas sin dato', () => {
  it('distingue lo que todavía no tiene asistencia de "nadie fue"', () => {
    render(<Mancuernas filas={[{ clave: 1, nombre: 'Futura', a: 0, b: 6, sinA: true }, { clave: 2, nombre: 'Vacía', a: 0, b: 6 }]} nombreA="Asistieron" nombreB="Agendadas" colorA="#0f0" colorB="#00f" textoSinA="sin asistencia aún" />);
    expect(screen.getByTitle('Agendadas: 6 · sin asistencia aún')).toBeInTheDocument();
    expect(screen.getByTitle('Asistieron: 0 · Agendadas: 6')).toBeInTheDocument();
  });
});
