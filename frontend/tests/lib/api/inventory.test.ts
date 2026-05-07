import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventarioApi } from '@/lib/api/inventory';
import { apiRequest } from '@/lib/api/client';
import { reservationsApi } from '@/lib/api/reservations';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api/reservations', () => ({
  reservationsApi: {
    listarSolicitudesInventario: vi.fn(),
  },
}));

const mockApiRequest = vi.mocked(apiRequest);
const mockListarSolicitudes = vi.mocked(reservationsApi.listarSolicitudesInventario);

describe('inventarioApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true });
    mockListarSolicitudes.mockReset();
  });

  it('listarInventarioPorEspacio uses espacioId in path', async () => {
    await inventarioApi.listarInventarioPorEspacio(7);
    expect(mockApiRequest).toHaveBeenCalledWith('/inventario/espacio/7', { method: 'GET' });
  });

  it('listarTiposElemento GET', async () => {
    await inventarioApi.listarTiposElemento();
    expect(mockApiRequest).toHaveBeenCalledWith('/tipos-elemento', { method: 'GET' });
  });

  it('crearTipoElemento POST', async () => {
    await inventarioApi.crearTipoElemento({ nombre: 'X' });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/tipos-elemento',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ nombre: 'X' }) }),
    );
  });

  it('actualizarTipoElemento PUT', async () => {
    await inventarioApi.actualizarTipoElemento(2, { nombre: 'Y' });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/tipos-elemento/2',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ nombre: 'Y' }) }),
    );
  });

  it('eliminarTipoElemento DELETE', async () => {
    await inventarioApi.eliminarTipoElemento(2);
    expect(mockApiRequest).toHaveBeenCalledWith('/tipos-elemento/2', { method: 'DELETE' });
  });

  it('crearInventarioItem POST', async () => {
    const data = { tipoElementoId: 1, cantidad: 5, estado: 'DISPONIBLE' as const };
    await inventarioApi.crearInventarioItem(data);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/inventario',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(data) }),
    );
  });

  it('actualizarInventarioItem PUT', async () => {
    const data = { tipoElementoId: 1, cantidad: 5, estado: 'DISPONIBLE' as const };
    await inventarioApi.actualizarInventarioItem(3, data);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/inventario/3',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(data) }),
    );
  });

  it('eliminarInventarioItem DELETE', async () => {
    await inventarioApi.eliminarInventarioItem(3);
    expect(mockApiRequest).toHaveBeenCalledWith('/inventario/3', { method: 'DELETE' });
  });

  it('listarInventario builds full query', async () => {
    await inventarioApi.listarInventario(
      1,
      20,
      { search: 'foo', espacioId: 2, tipoElementoId: 3, estado: 'DISPONIBLE', sinAsignar: true },
      'nombre',
      'asc',
    );
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('page=1');
    expect(url).toContain('size=20');
    expect(url).toContain('search=foo');
    expect(url).toContain('espacioId=2');
    expect(url).toContain('tipoElementoId=3');
    expect(url).toContain('estado=DISPONIBLE');
    expect(url).toContain('sinAsignar=true');
    expect(url).toContain('sort=nombre%2Casc');
  });

  it('listarInventario uses defaults when no filters', async () => {
    await inventarioApi.listarInventario();
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toBe('/inventario/paged?page=0&size=12');
  });

  it('filtrarInventario builds query', async () => {
    await inventarioApi.filtrarInventario({ search: 'a' }, 'nombre', 'desc');
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('search=a');
    expect(url).toContain('sortBy=nombre');
    expect(url).toContain('sortDir=desc');
  });

  it('obtenerEstadisticasInventario GET', async () => {
    await inventarioApi.obtenerEstadisticasInventario();
    expect(mockApiRequest).toHaveBeenCalledWith('/inventario/stats', { method: 'GET' });
  });

  it('obtenerEstadisticasDetalladasInventario without filters', async () => {
    await inventarioApi.obtenerEstadisticasDetalladasInventario();
    expect(mockApiRequest).toHaveBeenCalledWith('/stats/inventario/detailed', { method: 'GET' });
  });

  it('obtenerEstadisticasDetalladasInventario with filters', async () => {
    await inventarioApi.obtenerEstadisticasDetalladasInventario(1, 2, 'DISPONIBLE');
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('espacioId=1');
    expect(url).toContain('tipoElementoId=2');
    expect(url).toContain('estado=DISPONIBLE');
  });

  it('obtenerEstadisticasDetalladasInventario ignores estado="todos"', async () => {
    await inventarioApi.obtenerEstadisticasDetalladasInventario(null, null, 'todos');
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).not.toContain('estado=');
  });

  it('obtenerTodoElInventario GET', async () => {
    await inventarioApi.obtenerTodoElInventario();
    expect(mockApiRequest).toHaveBeenCalledWith('/inventario', { method: 'GET' });
  });

  it('obtenerSolicitudesPendientes delegates to reservationsApi.listarSolicitudesInventario', async () => {
    mockListarSolicitudes.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: {
        content: [{ id: 1 } as never],
        page: 0,
        size: 50,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        hasNext: false,
        hasPrevious: false,
        numberOfElements: 1,
      },
    });

    const res = await inventarioApi.obtenerSolicitudesPendientes();
    expect(mockListarSolicitudes).toHaveBeenCalledWith({
      estados: ['PENDIENTE'],
      page: 0,
      size: 50,
    });
    expect(res.data).toEqual([{ id: 1 }]);
  });

  it('obtenerSolicitudesPendientes returns empty array when no content', async () => {
    mockListarSolicitudes.mockResolvedValueOnce({ success: true });
    const res = await inventarioApi.obtenerSolicitudesPendientes();
    expect(res.data).toEqual([]);
  });
});
