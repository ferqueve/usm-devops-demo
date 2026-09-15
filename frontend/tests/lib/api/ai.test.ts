import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postAnalyzeAsistencia, postAnalyzeInventarioForecast } from '@/lib/api/ai';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);

describe('ai: análisis de predicciones', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true, data: { analisis: 'ok' } });
  });

  it('inventario va por el proxy de insights del backend', async () => {
    const pedido = { wape: 20, tipos: [] };
    await postAnalyzeInventarioForecast(pedido);
    expect(mockApiRequest).toHaveBeenCalledWith('/ai/insights/analyze-inventario-forecast', { method: 'POST', body: JSON.stringify(pedido) });
  });

  it('asistencia va por el proxy de insights del backend', async () => {
    const pedido = { auc: 0.7, tasaBase: 0.55, resumen: {}, proximas: [], factores: [] };
    await postAnalyzeAsistencia(pedido);
    expect(mockApiRequest).toHaveBeenCalledWith('/ai/insights/analyze-asistencia', { method: 'POST', body: JSON.stringify(pedido) });
  });

  it('si la IA está caída, el error sube en vez de quedar escondido en data', async () => {
    mockApiRequest.mockResolvedValue({ success: true, data: { status: 'error', error: 'sin cuota' } });
    await expect(postAnalyzeAsistencia({ auc: null, tasaBase: null, resumen: {}, proximas: [], factores: [] })).rejects.toThrow('sin cuota');
  });
});
