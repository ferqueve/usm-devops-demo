import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { inventario } from './datosPredicciones';

const api = vi.hoisted(() => ({ inventarioML: vi.fn() }));
vi.mock('@/lib/api/stats', () => ({ statsApi: api }));
const ai = vi.hoisted(() => ({ postAnalyzeInventarioForecast: vi.fn() }));
vi.mock('@/lib/api/ai', () => ai);
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));
vi.mock('@/components/ui/backgrounds/eventPatterns', () => ({ EventoPatternBg: () => null }));
vi.mock('recharts', async () => (await import('./mocks')).rechartsFalso());

import PrediccionesInventario from '@/components/predicciones/inventario/PrediccionesInventario';

let ubicacion = '';
function Ubicacion() {
  const l = useLocation();
  ubicacion = `${l.pathname}${l.search}`;
  return null;
}

const entrenar = vi.fn();
function montar(url = '/predicciones?tab=inventario') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <PrediccionesInventario version={0} entrenamiento={{ esAdmin: true, reentrenando: false, entrenar }} />
      <Ubicacion />
    </MemoryRouter>,
  );
}

function panel(nombre: string) {
  return screen.getByRole('heading', { name: nombre }).closest('section')!;
}

describe('PrediccionesInventario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    api.inventarioML.mockResolvedValue({ success: true, data: inventario });
    ai.postAnalyzeInventarioForecast.mockResolvedValue({ success: true, data: { analisis: 'Faltan proyectores el martes.' } });
  });

  it('el hero cuenta cuántos tipos pueden faltar y cuál primero, y el semáforo va en orden de riesgo', async () => {
    montar();
    // 2 en riesgo alto + 1 sin stock.
    expect(await screen.findByRole('heading', { name: '3 tipos de equipo pueden no alcanzar' })).toBeInTheDocument();
    expect(screen.getByText(/el primero es Proyector/).parentElement).toHaveTextContent('72%');

    const semaforo = panel('Riesgo por tipo');
    const nombres = within(semaforo).getAllByText(/^(Televisor|Proyector|Silla|Sistema de Audio)$/).map((n) => n.textContent);
    expect(nombres).toEqual(['Televisor', 'Proyector', 'Silla', 'Sistema de Audio']);
    expect(within(semaforo).getByText('Sin stock')).toBeInTheDocument();
    expect(within(semaforo).getByText('Riesgo alto')).toBeInTheDocument();
    // El omitido va con su motivo y sin barra.
    expect(within(semaforo).getByText('Sólo 6 días con pedidos')).toBeInTheDocument();
    expect(within(semaforo).getByText('Omitido')).toBeInTheDocument();
    // No copia la estructura de Estadísticas: sin índice de secciones.
    expect(screen.queryByRole('navigation', { name: 'Secciones' })).not.toBeInTheDocument();
  });

  it('la matriz marca las semanas en que lo ya pedido supera el stock', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Semana a semana' });
    // Televisor: stock 0 y 5 ya pedidas la primera semana.
    expect(screen.getByTitle(/Televisor · 14 \S+: 72% · 1 lo ya pedido supera el stock/)).toBeInTheDocument();
  });

  it('sin elección, el detalle muestra el tipo más urgente; tocar otro lo cambia', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Pico diario' });
    expect(screen.getByRole('radio', { name: 'Televisor' })).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(within(panel('Riesgo por tipo')).getByRole('button', { name: /Proyector/ }));

    await waitFor(() => expect(ubicacion).toBe('/predicciones?tab=inventario&tipoElemento=5'));
    expect(screen.getByRole('radio', { name: 'Proyector' })).toHaveAttribute('aria-checked', 'true');
    expect(within(panel('Pico diario')).getByText('Proyector · unidades pedidas a la vez')).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('un tipo omitido explica por qué no tiene detalle', async () => {
    montar('/predicciones?tab=inventario&tipoElemento=9');
    expect(await screen.findByText('Sistema de Audio no se modela.')).toBeInTheDocument();
    expect(screen.queryByText('Pico diario')).not.toBeInTheDocument();
  });

  it('confiabilidad: error por tipo y aviso si no le gana a la referencia', async () => {
    const { unmount } = montar();
    await screen.findByRole('heading', { name: '¿Qué tan confiable es?' });
    expect(within(panel('¿Qué tan confiable es?')).getByText('Todos')).toBeInTheDocument();
    expect(screen.queryByText('Todavía no le gana a la alternativa simple.')).not.toBeInTheDocument();
    unmount();

    api.inventarioML.mockResolvedValue({ success: true, data: { ...inventario, modelo: { ...inventario.modelo, wape: 35, wapeIngenuo: 30 } } });
    montar();
    expect(await screen.findByText('Todavía no le gana a la alternativa simple.')).toBeInTheDocument();
  });

  it('sin faltantes lo dice en positivo', async () => {
    api.inventarioML.mockResolvedValue({
      success: true,
      data: { ...inventario, resumen: { ...inventario.resumen!, tiposEnRiesgo: 0, tiposSinStock: 0, primerFaltante: null } },
    });
    montar();
    expect(await screen.findByRole('heading', { name: 'El equipamiento alcanza para lo que viene' })).toBeInTheDocument();
  });

  it('sin modelo entrenado, ofrece entrenarlo', async () => {
    api.inventarioML.mockResolvedValue({ success: true, data: { modelo: { entrenado: false }, tipos: [] } });
    montar();
    fireEvent.click(await screen.findByRole('button', { name: 'Entrenar el modelo de inventario' }));
    expect(entrenar).toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Riesgo por tipo' })).not.toBeInTheDocument();
  });

  it('si falla la carga lo dice', async () => {
    api.inventarioML.mockRejectedValue(new Error('500'));
    montar();
    expect(await screen.findByText('No se pudieron cargar las predicciones. Probá actualizar.')).toBeInTheDocument();
  });

  it('la lectura con IA manda sólo los tipos modelados', async () => {
    montar();
    fireEvent.click(await screen.findByRole('button', { name: 'Analizar con IA' }));
    expect(await screen.findByText('Faltan proyectores el martes.')).toBeInTheDocument();
    const pedido = ai.postAnalyzeInventarioForecast.mock.calls[0][0];
    expect(pedido.wape).toBe(22.1);
    expect(pedido.tipos.map((t: { nombre: string }) => t.nombre)).toEqual(['Televisor', 'Proyector', 'Silla']);
    expect(pedido.tipos[1]).toMatchObject({ stockDisponible: 8, riesgo: 'alto', comprometidasMax: 5, probFaltanteMax: 0.81 });
  });
});
