import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { academico, opciones, RANGO } from './datosReservas';

const api = vi.hoisted(() => ({ academico: vi.fn(), opcionesReservas: vi.fn() }));

vi.mock('@/lib/api/stats', () => ({ statsApi: api }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));
vi.mock('recharts', () => {
  const S = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { ResponsiveContainer: S, BarChart: S, Bar: S, Cell: S, CartesianGrid: S, Tooltip: S, XAxis: S, YAxis: S, PieChart: S, Pie: S };
});

import EstadisticasAcademico from '@/components/statistics/academico/EstadisticasAcademico';

function montar(url = '/statistics?tab=academico') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <EstadisticasAcademico rango={RANGO} periodoLabel="Últimos 30 días" />
    </MemoryRouter>,
  );
}

describe('EstadisticasAcademico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.academico.mockResolvedValue({ data: academico });
    api.opcionesReservas.mockResolvedValue({ data: opciones });
  });

  it('pide con los filtros de su propia URL (prefijo a) y sin rol', async () => {
    montar('/statistics?tab=academico&aedificio=1&acarrera=3&redificio=9&rrol=DOCENTE');
    await screen.findByRole('heading', { name: 'Tutorías' });
    expect(api.academico).toHaveBeenCalledWith({ ...RANGO, edificioId: 1, espacioId: null, tipoEspacioId: null, carreraId: 3 });
    const chips = await screen.findByLabelText('Filtros aplicados');
    expect(within(chips).getByText('Edificio A')).toBeInTheDocument();
    expect(within(chips).getByText('Ingeniería')).toBeInTheDocument();
    expect(within(chips).queryByText(/Rol/)).not.toBeInTheDocument();
  });

  it('muestra tutorías y eventos con sus paneles', async () => {
    montar();
    expect(await screen.findByRole('heading', { name: 'Tutorías' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Eventos' })).toBeInTheDocument();
    expect(screen.getByText('Cálculo I')).toBeInTheDocument();
    expect(screen.getByText('Presenciales')).toBeInTheDocument();
    // Eventos: lista, tipos y el que se llenó.
    const eventos = document.getElementById('eventos')!;
    expect(within(eventos).getAllByText('Charla de robótica').length).toBeGreaterThan(0);
    expect(within(eventos).getAllByText('Talleres').length).toBeGreaterThan(0);
    expect(within(eventos).getAllByText('Llenos').length).toBeGreaterThan(1);
    expect(within(eventos).getByText('Qué tan llenos')).toBeInTheDocument();
    expect(within(eventos).getByText('Mejor calificados')).toBeInTheDocument();
  });

  it('si falla lo dice, sin romper la barra de filtros', async () => {
    api.academico.mockRejectedValue(new Error('500'));
    montar();
    await waitFor(() => expect(screen.getByText('No se pudieron cargar las estadísticas académicas. Probá actualizar.')).toBeInTheDocument());
    expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeInTheDocument();
  });
});
