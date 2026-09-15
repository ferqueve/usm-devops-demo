import { describe, it, expect, vi, beforeEach } from 'vitest';
import { statsApi } from '@/lib/api/stats';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);

describe('statsApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true });
  });

  it('getActiveUsers calls GET /stats/active-users', async () => {
    await statsApi.getActiveUsers();
    expect(mockApiRequest).toHaveBeenCalledWith('/stats/active-users', { method: 'GET' });
  });

  it('estadoInventario manda sólo los filtros elegidos', async () => {
    await statsApi.estadoInventario({});
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/inventario/estado', { method: 'GET' });

    await statsApi.estadoInventario({ edificioId: 3, espacioId: null, tipoElementoId: 7 });
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/inventario/estado?edificioId=3&tipoElementoId=7', { method: 'GET' });
  });

  it('resumenReservas y altasInventario llevan el período', async () => {
    const rango = { desde: '2026-08-16', hasta: '2026-09-14' };
    await statsApi.resumenReservas(rango);
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/reservas/resumen?desde=2026-08-16&hasta=2026-09-14', { method: 'GET' });
    await statsApi.altasInventario(rango);
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/inventario/altas?desde=2026-08-16&hasta=2026-09-14', { method: 'GET' });
  });

  it('predicciones: forecast y calidad por tipo de espacio, y los endpoints de cada modelo', async () => {
    await statsApi.forecastDemanda(60);
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/ml/forecast?diasHistorico=60', { method: 'GET' });
    await statsApi.forecastDemanda(60, 3);
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/ml/forecast?diasHistorico=60&tipoEspacioId=3', { method: 'GET' });
    await statsApi.calidadModeloML();
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/ml/calidad-modelo', { method: 'GET' });
    await statsApi.calidadModeloML(3);
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/ml/calidad-modelo?tipoEspacioId=3', { method: 'GET' });
    await statsApi.tiposEspacioML();
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/ml/tipos-espacio', { method: 'GET' });
    await statsApi.inventarioML();
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/ml/inventario', { method: 'GET' });
    await statsApi.academicoML();
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/ml/academico', { method: 'GET' });
  });

  it('reentrenar dice qué modelo, y por defecto el de reservas', async () => {
    await statsApi.reentrenarModeloML();
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/ml/reentrenar?modelo=reservas', { method: 'POST' });
    await statsApi.reentrenarModeloML('todo');
    expect(mockApiRequest).toHaveBeenLastCalledWith('/stats/ml/reentrenar?modelo=todo', { method: 'POST' });
  });
});
