import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);

describe('recomendacionesApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true });
  });

  it('obtenerRecomendacionesEspacios builds query params', async () => {
    await recomendacionesApi.obtenerRecomendacionesEspacios({
      inicio: '2024-01-01T10:00:00Z',
      fin: '2024-01-01T12:00:00Z',
      capacidad: 30,
    });
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('/recomendaciones/reservas/espacios?');
    expect(url).toContain('capacidad=30');
    expect(url).toContain('inicio=');
    expect(url).toContain('fin=');
  });

  it('obtenerRecomendacionesEspacios omits capacidad when not provided', async () => {
    await recomendacionesApi.obtenerRecomendacionesEspacios({
      inicio: '2024-01-01T10:00:00Z',
      fin: '2024-01-01T12:00:00Z',
    });
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).not.toContain('capacidad=');
  });

  it('obtenerHorariosOptimos passes espacioId and fecha', async () => {
    await recomendacionesApi.obtenerHorariosOptimos({ espacioId: 4, fecha: '2024-01-01' });
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('/recomendaciones/reservas/horarios?');
    expect(url).toContain('espacioId=4');
    expect(url).toContain('fecha=2024-01-01');
  });

  it('obtenerEspaciosSimilares uses query string', async () => {
    await recomendacionesApi.obtenerEspaciosSimilares(7);
    expect(mockApiRequest).toHaveBeenCalledWith('/recomendaciones/reservas/espacios-similares?espacioId=7');
  });

  it('obtenerItemsMantenimiento GET path', async () => {
    await recomendacionesApi.obtenerItemsMantenimiento();
    expect(mockApiRequest).toHaveBeenCalledWith('/recomendaciones/inventario/mantenimiento');
  });

  it('obtenerEspaciosAtencion GET path', async () => {
    await recomendacionesApi.obtenerEspaciosAtencion();
    expect(mockApiRequest).toHaveBeenCalledWith('/recomendaciones/inventario/espacios-atencion');
  });

  it('obtenerReasignaciones GET path', async () => {
    await recomendacionesApi.obtenerReasignaciones();
    expect(mockApiRequest).toHaveBeenCalledWith('/recomendaciones/inventario/reasignaciones');
  });

  it('obtenerComprasNecesarias GET path', async () => {
    await recomendacionesApi.obtenerComprasNecesarias();
    expect(mockApiRequest).toHaveBeenCalledWith('/recomendaciones/inventario/compras');
  });

  it('obtenerItemsParaReserva includes espacioId', async () => {
    await recomendacionesApi.obtenerItemsParaReserva(2);
    expect(mockApiRequest).toHaveBeenCalledWith('/recomendaciones/items/para-reserva?espacioId=2');
  });

  it('obtenerCombinacionesItems includes espacioId', async () => {
    await recomendacionesApi.obtenerCombinacionesItems(3);
    expect(mockApiRequest).toHaveBeenCalledWith('/recomendaciones/items/combinaciones?espacioId=3');
  });

  it('obtenerAnalistaRecomendado includes docenteId', async () => {
    await recomendacionesApi.obtenerAnalistaRecomendado(11);
    expect(mockApiRequest).toHaveBeenCalledWith('/recomendaciones/analistas/asignacion?docenteId=11');
  });

  it('obtenerReservasPrioritarias GET path', async () => {
    await recomendacionesApi.obtenerReservasPrioritarias();
    expect(mockApiRequest).toHaveBeenCalledWith('/recomendaciones/analistas/prioritarias');
  });

  it('obtenerRecomendacionesDashboard GET path', async () => {
    await recomendacionesApi.obtenerRecomendacionesDashboard();
    expect(mockApiRequest).toHaveBeenCalledWith('/recomendaciones/dashboard');
  });
});
