import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { fireEvent } from '@testing-library/react';
import { equipos } from './datosReservas';
import type { EstadoInventario } from '@/lib/api/stats';

const estado: EstadoInventario = {
  totales: { items: 10, unidades: 120, disponibles: 7, mantenimiento: 2, danados: 1, sinEspacio: 1 },
  cobertura: { espacios: 4, conInventario: 3 },
  porTipo: [
    { id: 1, nombre: 'Silla', detalle: null, items: 6, unidades: 100, disponibles: 5, mantenimiento: 1, danados: 0 },
    { id: 2, nombre: 'Proyector', detalle: null, items: 4, unidades: 4, disponibles: 2, mantenimiento: 1, danados: 1 },
    { id: 3, nombre: 'Pizarra', detalle: null, items: 0, unidades: 0, disponibles: 0, mantenimiento: 0, danados: 0 },
  ],
  porEspacio: [
    { id: 10, nombre: 'Aula 1', detalle: 'Edificio A', items: 9, unidades: 119, disponibles: 6, mantenimiento: 2, danados: 1 },
    { id: 11, nombre: 'Aula vacía', detalle: 'Edificio A', items: 0, unidades: 0, disponibles: 0, mantenimiento: 0, danados: 0 },
  ],
  matriz: [{ espacioId: 10, tipoId: 1, items: 6, unidades: 100 }],
  atencion: [
    { id: 5, tipo: 'Proyector', espacio: 'Aula 1', estado: 'DANADO', cantidad: 1, diasSinCambios: 40, observaciones: 'lámpara quemada' },
    { id: 6, tipo: 'Silla', espacio: null, estado: 'MANTENIMIENTO', cantidad: 3, diasSinCambios: 2, observaciones: null },
  ],
  antiguedad: { menosDe30Dias: 1, de30a90Dias: 2, de90DiasAUnAnio: 3, masDeUnAnio: 4, sinCambiosHace6Meses: 5 },
  opciones: {
    edificios: [{ id: 1, nombre: 'Edificio A', padreId: null }],
    espacios: [{ id: 10, nombre: 'Aula 1', padreId: 1 }],
    tipos: [{ id: 1, nombre: 'Silla', padreId: null }],
  },
};

const api = vi.hoisted(() => ({
  estadoInventario: vi.fn(),
  evolucionEstadoInventario: vi.fn(),
  evolucionParqueInventario: vi.fn(),
  altasInventario: vi.fn(),
  deltaInventario: vi.fn(),
  demandaInventario: vi.fn(),
}));

vi.mock('@/lib/api/stats', () => ({ statsApi: api }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));
vi.mock('recharts', () => {
  const S = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { ResponsiveContainer: S, LineChart: S, Line: S, AreaChart: S, Area: S, CartesianGrid: S, Tooltip: S, XAxis: S, YAxis: S, PieChart: S, Pie: S, Cell: S, Treemap: S, Legend: S };
});

import EstadisticasInventario from '@/components/statistics/inventario/EstadisticasInventario';

function Ubicacion() {
  return <output data-testid="url">{useLocation().search}</output>;
}

function montar(url = '/statistics?tab=inventario') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <EstadisticasInventario rango={{ desde: '2026-06-17', hasta: '2026-09-14' }} />
      <Ubicacion />
    </MemoryRouter>,
  );
}

describe('EstadisticasInventario', () => {
  beforeEach(() => {
    api.estadoInventario.mockReset().mockResolvedValue({ data: estado });
    api.evolucionEstadoInventario.mockResolvedValue({ data: [] });
    api.evolucionParqueInventario.mockResolvedValue({ data: [] });
    api.altasInventario.mockResolvedValue({ data: [{ tipo: 'Silla', items: 2, unidades: 20 }] });
    api.deltaInventario.mockResolvedValue({ data: null });
    api.demandaInventario.mockReset().mockResolvedValue({ data: equipos });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('la demanda usa el período y los filtros de inventario', async () => {
    montar('/statistics?tab=inventario&edificio=1&tipo=1');
    expect(await screen.findByRole('heading', { name: 'Demanda' })).toBeInTheDocument();
    expect(api.demandaInventario).toHaveBeenCalledWith({ desde: '2026-06-17', hasta: '2026-09-14', edificioId: 1, espacioId: null, tipoElementoId: 1 });
    expect(screen.getByText('Del pedido a la entrega')).toBeInTheDocument();
    expect(document.querySelector('#demanda li[data-severidad="falta"]')).toHaveTextContent('Proyector');
    expect(screen.getByRole('link', { name: /Demanda/ })).toHaveAttribute('href', '#demanda');
  });

  it('"ver estado" filtra el estado por ese espacio en la misma vista', async () => {
    montar();
    const boton = await screen.findByRole('button', { name: /ver estado/ });
    fireEvent.click(boton);
    await waitFor(() => expect(new URLSearchParams(screen.getByTestId('url').textContent ?? '').get('espacio')).toBe('1'));
    expect(new URLSearchParams(screen.getByTestId('url').textContent ?? '').get('tab')).toBe('inventario');
    await waitFor(() => expect(api.estadoInventario).toHaveBeenLastCalledWith({ edificioId: null, espacioId: 1, tipoElementoId: null }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('si la demanda falla, el estado se sigue viendo', async () => {
    api.demandaInventario.mockRejectedValue(new Error('500'));
    montar();
    expect(await screen.findByText('No se pudo cargar la demanda de equipos. Probá actualizar.')).toBeInTheDocument();
    expect(screen.getByText('Requieren atención')).toBeInTheDocument();
  });

  it('los filtros salen de la URL', async () => {
    montar('/statistics?tab=inventario&edificio=1&tipo=1');
    await screen.findByText('Requieren atención');
    expect(api.estadoInventario).toHaveBeenCalledWith({ edificioId: 1, espacioId: null, tipoElementoId: 1 });
    expect(screen.getByRole('button', { name: /Limpiar filtros/ })).toBeInTheDocument();
  });

  it('sin filtros no ofrece limpiar', async () => {
    montar();
    await screen.findByText('Requieren atención');
    expect(screen.queryByRole('button', { name: /Limpiar filtros/ })).not.toBeInTheDocument();
  });

  it('lista lo que requiere atención, con el espacio o su falta', async () => {
    montar();
    await screen.findByText('Requieren atención');
    expect(screen.getByText(/lámpara quemada/)).toBeInTheDocument();
    expect(screen.getByText(/sin espacio asignado/)).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
  });

  it('marca los tipos y espacios vacíos en vez de esconderlos', async () => {
    montar();
    await screen.findByText('Por tipo');
    expect(screen.getByText('Pizarra')).toBeInTheDocument();
    expect(screen.getByText('Aula vacía')).toBeInTheDocument();
    expect(screen.getAllByText('vacío')).toHaveLength(2);
  });

  it('la evolución muestra las altas del período', async () => {
    montar();
    await waitFor(() => expect(screen.getByText('2 silla')).toBeInTheDocument());
    expect(api.altasInventario).toHaveBeenCalledWith({ desde: '2026-06-17', hasta: '2026-09-14' });
  });
});
