import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { calidad, forecast, tiposEspacio } from './datosPredicciones';

const api = vi.hoisted(() => ({ forecastDemanda: vi.fn(), calidadModeloML: vi.fn(), tiposEspacioML: vi.fn() }));
vi.mock('@/lib/api/stats', () => ({ statsApi: api }));
const ai = vi.hoisted(() => ({ postAnalyzeForecast: vi.fn() }));
vi.mock('@/lib/api/ai', () => ai);
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));
vi.mock('@/components/ui/backgrounds/eventPatterns', () => ({ EventoPatternBg: () => null }));
vi.mock('recharts', async () => (await import('./mocks')).rechartsFalso());

import PrediccionesReservas from '@/components/predicciones/reservas/PrediccionesReservas';

let ubicacion = '';
function Ubicacion() {
  const l = useLocation();
  ubicacion = `${l.pathname}${l.search}`;
  return null;
}

const entrenar = vi.fn();
function montar(url = '/predicciones?tab=reservas', esAdmin = true) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <PrediccionesReservas version={0} entrenamiento={{ esAdmin, reentrenando: false, entrenar }} />
      <Ubicacion />
    </MemoryRouter>,
  );
}

describe('PrediccionesReservas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    api.forecastDemanda.mockResolvedValue({ success: true, data: forecast });
    api.calidadModeloML.mockResolvedValue({ success: true, data: calidad });
    api.tiposEspacioML.mockResolvedValue({ success: true, data: tiposEspacio });
    ai.postAnalyzeForecast.mockResolvedValue({ success: true, data: { analisis: 'Viene una semana cargada.' } });
  });

  it('muestra el pronóstico del campus con su hero, tarjetas y paneles', async () => {
    montar();
    expect(await screen.findByRole('heading', { name: /^Se esperan .* reservas$/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Demanda diaria' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '¿Qué tan confiable es?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Por tipo de espacio' })).toBeInTheDocument();
    expect(api.forecastDemanda).toHaveBeenCalledWith(60, null);
    expect(api.calidadModeloML).toHaveBeenCalledWith(null);
    // Anillo del hero: precisión = 100 − WAPE.
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('precisión en validación')).toBeInTheDocument();
    expect(screen.getByText('Error típico')).toBeInTheDocument();
    expect(screen.getByText('Se equivoca 28% menos que la alternativa simple.', { exact: false })).toBeInTheDocument();
    // No copia la estructura de Estadísticas: sin índice de secciones.
    expect(screen.queryByRole('navigation', { name: 'Secciones' })).not.toBeInTheDocument();
  });

  it('por tipo: una tarjeta por tipo, los sin modelo aparte, y tocar uno cambia el pronóstico de arriba', async () => {
    montar();
    const panel = await screen.findByRole('heading', { name: 'Por tipo de espacio' }).then((h) => h.closest('section')!);
    expect(within(panel).getByText(/Sin modelo propio/)).toBeInTheDocument();

    fireEvent.click(within(panel).getByRole('button', { name: /Aula/ }));

    await waitFor(() => expect(api.forecastDemanda).toHaveBeenLastCalledWith(60, 1));
    expect(api.calidadModeloML).toHaveBeenLastCalledWith(1);
    expect(ubicacion).toBe('/predicciones?tab=reservas&tipoEspacio=1');
    expect(await screen.findByRole('heading', { name: /^Se esperan .* reservas en Aula$/ })).toBeInTheDocument();

    // El hero deja volver al campus.
    fireEvent.click(screen.getByRole('button', { name: 'Volver al campus entero' }));
    await waitFor(() => expect(ubicacion).toBe('/predicciones?tab=reservas'));
  });

  it('un tipo sin modelo propio en la URL avisa y deja volver', async () => {
    api.forecastDemanda.mockResolvedValue({ success: true, data: { ...forecast, modeloId: null, predicciones: [] } });
    montar('/predicciones?tab=reservas&tipoEspacio=4');
    expect(await screen.findByText('Otro no tiene modelo propio.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver el campus entero' }));
    await waitFor(() => expect(ubicacion).toBe('/predicciones?tab=reservas'));
  });

  it('sin modelo entrenado, el admin lo puede entrenar desde la vista', async () => {
    api.forecastDemanda.mockResolvedValue({ success: true, data: { ...forecast, modeloId: null, predicciones: [] } });
    montar();
    fireEvent.click(await screen.findByRole('button', { name: 'Entrenar el modelo de reservas' }));
    expect(entrenar).toHaveBeenCalled();
  });

  it('sin modelo y sin ser admin, pide a un administrador', async () => {
    api.forecastDemanda.mockResolvedValue({ success: true, data: { ...forecast, modeloId: null, predicciones: [] } });
    montar('/predicciones', false);
    expect(await screen.findByText('Un administrador tiene que entrenarlo primero.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Entrenar/ })).not.toBeInTheDocument();
  });

  it('avisa si el modelo quedó atrás de hoy', async () => {
    api.forecastDemanda.mockResolvedValue({ success: true, data: { ...forecast, hoy: '2026-09-20' } });
    montar();
    expect(await screen.findByText(/así que el pronóstico arranca el/)).toBeInTheDocument();
  });

  it('si los modelos por tipo no responden, el resto se ve igual', async () => {
    api.tiposEspacioML.mockRejectedValue(new Error('404'));
    montar();
    expect(await screen.findByRole('heading', { name: 'Demanda diaria' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Por tipo de espacio' })).not.toBeInTheDocument();
  });

  it('pide la lectura con IA con el pronóstico que se ve', async () => {
    montar();
    fireEvent.click(await screen.findByRole('button', { name: 'Analizar con IA' }));
    expect(await screen.findByText('Viene una semana cargada.')).toBeInTheDocument();
    expect(ai.postAnalyzeForecast).toHaveBeenCalledWith(expect.objectContaining({ wape: 18, mape: 20 }));
  });
});
