import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { aprobacion, espacios, externos, novedades, opciones, RANGO, resumen } from './datosReservas';

const api = vi.hoisted(() => ({
  resumenReservas: vi.fn(),
  ocupacionPorEspacio: vi.fn(),
  heatmapDiaHora: vi.fn(),
  resumenPorCarrera: vi.fn(),
  resumenPorEdificio: vi.fn(),
  topUsuarios: vi.fn(),
  opcionesReservas: vi.fn(),
  aprobacionReservas: vi.fn(),
  espaciosReservas: vi.fn(),
  externosReservas: vi.fn(),
  novedadesReservas: vi.fn(),
}));

vi.mock('@/lib/api/stats', () => ({ statsApi: api }));
vi.mock('@/lib/api/ai', () => ({ postStatsSummary: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));
vi.mock('recharts', () => {
  const S = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { ResponsiveContainer: S, BarChart: S, Bar: S, Cell: S, CartesianGrid: S, Tooltip: S, XAxis: S, YAxis: S, ZAxis: S, AreaChart: S, Area: S, PieChart: S, Pie: S, RadarChart: S, Radar: S, PolarGrid: S, PolarAngleAxis: S, ScatterChart: S, Scatter: S, ReferenceLine: S, Treemap: S, LabelList: S };
});

import EstadisticasReservas from '@/components/statistics/reservas/EstadisticasReservas';

function Ubicacion() {
  const { search } = useLocation();
  return <output data-testid="url">{search}</output>;
}

function montar(url = '/statistics?tab=reservas') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <EstadisticasReservas rango={RANGO} periodoLabel="Últimos 30 días" />
      <Ubicacion />
    </MemoryRouter>,
  );
}

const SIN_FILTROS = { edificioId: null, espacioId: null, tipoEspacioId: null, rol: null, carreraId: null };
const url = () => new URLSearchParams(screen.getByTestId('url').textContent ?? '');

describe('EstadisticasReservas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.resumenReservas.mockResolvedValue({ data: resumen });
    api.ocupacionPorEspacio.mockResolvedValue({ data: [{ espacioId: 1, espacioNombre: 'Aula 11', edificioNombre: 'Edificio A', horasReservadas: 40, horasDisponibles: 420, reservas: 30, porcentaje: 9.5 }, { espacioId: 2, espacioNombre: 'Sala vacía', edificioNombre: null, horasReservadas: 0, horasDisponibles: 420, reservas: 0, porcentaje: 0 }] });
    api.heatmapDiaHora.mockResolvedValue({ data: [{ diaSemana: 1, hora: 10, cant: 12 }] });
    api.resumenPorCarrera.mockResolvedValue({ data: [
      { carreraId: null, carreraNombre: 'Sin carrera', aprobadas: 80, canceladas: 10, pendientes: 10, canceladasTarde: 2, tasaCancelacion: 11.1 },
      { carreraId: 3, carreraNombre: 'Ingeniería', aprobadas: 50, canceladas: 20, pendientes: 0, canceladasTarde: 5, tasaCancelacion: 28.6 },
    ] });
    api.resumenPorEdificio.mockResolvedValue({ data: [{ edificioId: 1, edificioNombre: 'Edificio A', cantReservas: 150 }] });
    api.topUsuarios.mockResolvedValue({ data: [] });
    api.opcionesReservas.mockResolvedValue({ data: opciones });
    api.aprobacionReservas.mockResolvedValue({ data: aprobacion });
    api.espaciosReservas.mockResolvedValue({ data: espacios });
    api.externosReservas.mockResolvedValue({ data: externos });
    api.novedadesReservas.mockResolvedValue({ data: novedades });
  });

  it('pide todo para el mismo período, sin filtros ni comparación', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Resumen' });
    const consulta = { ...RANGO, ...SIN_FILTROS };
    expect(api.resumenReservas).toHaveBeenCalledWith({ ...consulta, comparar: 'anterior' });
    expect(api.novedadesReservas).toHaveBeenCalledWith({ ...consulta, comparar: 'anterior' });
    expect(api.heatmapDiaHora).toHaveBeenCalledWith(consulta);
    expect(api.aprobacionReservas).toHaveBeenCalledWith(consulta);
    expect(api.externosReservas).toHaveBeenCalledWith(consulta);
    expect(api.topUsuarios).toHaveBeenCalledWith({ ...consulta, limite: 10 });
  });

  it('los filtros y la comparación salen de la URL y van a todos los pedidos', async () => {
    montar('/statistics?tab=reservas&redificio=1&rtipo=2&rrol=DOCENTE&rcarrera=3&comparar=anio');
    await screen.findByRole('heading', { name: 'Resumen' });
    const consulta = { ...RANGO, edificioId: 1, espacioId: null, tipoEspacioId: 2, rol: 'DOCENTE', carreraId: 3 };
    expect(api.ocupacionPorEspacio).toHaveBeenCalledWith(consulta);
    expect(api.externosReservas).toHaveBeenCalledWith(consulta);
    expect(api.espaciosReservas).toHaveBeenCalledWith(consulta);
    expect(api.resumenReservas).toHaveBeenCalledWith({ ...consulta, comparar: 'anio' });
    // Los nombres salen de las opciones, y hay cómo limpiar.
    const chips = await screen.findByLabelText('Filtros aplicados');
    expect(within(chips).getByText('Edificio A')).toBeInTheDocument();
    expect(within(chips).getByText('Docentes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Limpiar filtros/ })).toBeInTheDocument();
  });

  it('no confunde sus filtros con los de inventario', async () => {
    montar('/statistics?tab=reservas&edificio=1&espacio=9');
    await screen.findByRole('heading', { name: 'Resumen' });
    expect(api.resumenReservas).toHaveBeenCalledWith({ ...RANGO, ...SIN_FILTROS, comparar: 'anterior' });
    expect(screen.queryByRole('button', { name: /Limpiar filtros/ })).not.toBeInTheDocument();
  });

  it('cambia contra qué compara y lo dice con fechas', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Resumen' });
    expect(screen.getAllByTitle(/contra el período anterior \(17 jul al 15 ago\)/)[0]).toHaveTextContent('↑ 25%');
    api.resumenReservas.mockResolvedValue({ data: { ...resumen, comparacion: 'anio', desdeAnterior: '2025-08-16', hastaAnterior: '2025-09-14' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Año pasado' }));
    await waitFor(() => expect(api.resumenReservas).toHaveBeenLastCalledWith({ ...RANGO, ...SIN_FILTROS, comparar: 'anio' }));
    expect(api.novedadesReservas).toHaveBeenLastCalledWith({ ...RANGO, ...SIN_FILTROS, comparar: 'anio' });
    expect(url().get('comparar')).toBe('anio');
    await waitFor(() => expect(document.body.textContent?.match(/contra el año[^.]{0,40}/)?.[0]).toMatch(/contra el año pasado \(16 ago 2025 al 14 se\w+ 2025\)/));
  });

  it('muestra las novedades con su tono y filtra al hacerles clic', async () => {
    montar();
    const tarjeta = (titulo: string) => screen.getAllByTitle(`Filtrar por ${titulo}`).find((e) => e.hasAttribute('data-tono'))!;
    await screen.findByRole('heading', { name: 'Novedades' });
    expect(tarjeta('Aula 11')).toHaveAttribute('data-tono', 'neutro');
    expect(tarjeta('Ingeniería')).toHaveAttribute('data-tono', 'malo');
    // La de tiempo de respuesta no filtra nada, pero es buena.
    const respuesta = screen.getByText('Tiempo de respuesta', { selector: 'span' }).closest('li')!;
    expect(respuesta).toHaveAttribute('data-tono', 'bueno');
    expect(respuesta).not.toHaveAttribute('role');
    expect(respuesta.textContent).toContain('−24 h');

    fireEvent.click(tarjeta('Externos'));
    await waitFor(() => expect(url().get('rrol')).toBe('EXTERNO'));
    await waitFor(() => expect(api.resumenPorCarrera).toHaveBeenLastCalledWith({ ...RANGO, ...SIN_FILTROS, rol: 'EXTERNO' }));
  });

  it('sin novedades lo dice amablemente', async () => {
    api.novedadesReservas.mockResolvedValue({ data: [] });
    montar();
    expect(await screen.findByText(/nada cambió lo suficiente/)).toBeInTheDocument();
  });

  it('clic en una carrera, un espacio o un edificio filtra, y otro clic lo saca', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Uso' });
    const fila = screen.getByText('Ingeniería', { selector: 'td' }).closest('tr')!;
    expect(fila).toHaveAttribute('title', 'Filtrar por Ingeniería');
    fireEvent.click(fila);
    await waitFor(() => expect(url().get('rcarrera')).toBe('3'));
    await waitFor(() => expect(api.aprobacionReservas).toHaveBeenLastCalledWith({ ...RANGO, ...SIN_FILTROS, carreraId: 3 }));

    fireEvent.click(screen.getByText('Ingeniería', { selector: 'td' }).closest('tr')!);
    await waitFor(() => expect(url().get('rcarrera')).toBeNull());

    const menosUsado = screen.getAllByTitle('Filtrar por Sala vacía').find((e) => e.tagName === 'LI')!;
    fireEvent.click(menosUsado);
    await waitFor(() => expect(url().get('respacio')).toBe('2'));

    fireEvent.click(screen.getAllByTitle('Filtrar por Edificio A')[0]);
    await waitFor(() => expect(url().get('redificio')).toBe('1'));
    // Sala vacía es del edificio A: el espacio queda.
    expect(url().get('respacio')).toBe('2');
  });

  it('las secciones nuevas muestran sus datos, y equipos y académico ya no están', async () => {
    montar();
    expect(await screen.findByRole('heading', { name: 'Aprobación' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Espacios y capacidad' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Aprobación/ })).toHaveAttribute('href', '#aprobacion');
    expect(screen.queryByRole('heading', { name: 'Equipos pedidos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Académico' })).not.toBeInTheDocument();
    expect(api).not.toHaveProperty('equiposReservas');

    // Aprobación
    expect(screen.getByText('Ana Analista')).toBeInTheDocument();
    expect(screen.getAllByText('5,2 h').length).toBeGreaterThan(0);
    expect(screen.getByText('Mismo día')).toBeInTheDocument();
    // La saturación ahora está en Uso.
    const uso = document.getElementById('uso')!;
    expect(within(uso).getByText('Saturación por tipo y hora')).toBeInTheDocument();
    expect(within(uso).getByText('Laboratorio')).toBeInTheDocument();
    expect(within(uso).getByText('Horas sin lugar')).toBeInTheDocument();
    // Espacios y capacidad
    const esp = document.getElementById('espacios')!;
    expect(within(esp).queryByText('Saturación por tipo y hora')).not.toBeInTheDocument();
    expect(within(esp).getByText('Charla desbordada')).toBeInTheDocument();
    expect(within(esp).getByText(/1 excede el espacio/)).toBeInTheDocument();
    expect(within(esp).getByText('Excede')).toBeInTheDocument();
    expect(within(esp).getAllByText('Sobra espacio').length).toBeGreaterThan(0);
    expect(within(esp).getByText('55 inscriptos')).toBeInTheDocument();
  });

  it('los organizadores externos están en Quién reserva', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Quién reserva' });
    const quien = document.getElementById('quien')!;
    expect(within(quien).getByText('Organizadores externos')).toBeInTheDocument();
    expect(within(quien).getByText('ACME')).toBeInTheDocument();
    // 4 de 5 aprobados, con horas y espacios.
    expect(within(quien).getByText('Se les aprueba')).toBeInTheDocument();
    expect(within(quien).getAllByText(/12 h/).length).toBeGreaterThan(0);
    expect(within(quien).getByRole('img', { name: 'Se les aprueba: 80%' })).toBeInTheDocument();
  });

  it('si un pedido falla, sólo su parte queda vacía', async () => {
    api.externosReservas.mockRejectedValue(new Error('500'));
    api.espaciosReservas.mockResolvedValue({ data: null });
    montar();
    await screen.findByRole('heading', { name: 'Espacios y capacidad' });
    expect(screen.getByText('No se pudieron cargar estas estadísticas. Probá actualizar.')).toBeInTheDocument();
    expect(screen.getAllByText('No se pudieron cargar los externos. Probá actualizar.').length).toBeGreaterThan(0);
    expect(screen.getByText('No se pudo cargar la saturación. Probá actualizar.')).toBeInTheDocument();
    expect(screen.getByText('Ana Analista')).toBeInTheDocument();
  });

  it('ocupación, carrera y edificio ya no dicen "hasta anoche"', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Uso' });
    expect(screen.queryByText('datos hasta anoche')).not.toBeInTheDocument();
  });

  it('muestra los espacios sin uso y deja "sin carrera" al pie de la tabla', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Uso' });
    expect(screen.getAllByText('sin uso')).toHaveLength(1);
    expect(screen.getByText('Ingeniería', { selector: 'td' }).closest('tr')).not.toBeNull();
    expect(screen.queryByRole('cell', { name: 'Sin carrera' })).not.toBeInTheDocument();
    expect(screen.getByText(/no tienen carrera asociada/)).toBeInTheDocument();
  });
});
