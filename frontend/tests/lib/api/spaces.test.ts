import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { espaciosApi } from '@/lib/api/spaces';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);
const ORIGINAL_FETCH = globalThis.fetch;

describe('espaciosApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true });
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it('listarEspacios builds query with filters and inventory filters', async () => {
    await espaciosApi.listarEspacios(2, 10, {
      search: 'sala',
      tipoEspacioId: 1,
      edificioId: 2,
      capacidadMin: 10,
      capacidadMax: 50,
      estado: 'DISPONIBLE',
      filtrosInventario: [
        { tipoElementoId: 5, cantidadMin: 1, cantidadMax: 3 },
        { tipoElementoId: 6 },
      ],
    });
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('/espacios/paged?');
    expect(url).toContain('search=sala');
    expect(url).toContain('tipoEspacioId=1');
    expect(url).toContain('edificioId=2');
    expect(url).toContain('capacidadMin=10');
    expect(url).toContain('capacidadMax=50');
    expect(url).toContain('estado=DISPONIBLE');
    expect(url).toContain('tipoElementoIds=5');
    expect(url).toContain('tipoElementoIds=6');
    expect(url).toContain('cantidadMins=1');
    expect(url).toContain('cantidadMaxs=3');
    expect(url).toContain('page=2');
    expect(url).toContain('size=10');
  });

  it('listarEspacios uses defaults', async () => {
    await espaciosApi.listarEspacios();
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('page=0');
    expect(url).toContain('size=12');
  });

  it('filtrarEspacios builds query without paging', async () => {
    await espaciosApi.filtrarEspacios({ search: 'foo' });
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('/espacios/filter?');
    expect(url).toContain('search=foo');
    expect(url).not.toContain('page=');
  });

  it('obtenerEspacio GET', async () => {
    await espaciosApi.obtenerEspacio(7);
    expect(mockApiRequest).toHaveBeenCalledWith('/espacios/7', { method: 'GET' });
  });

  it('crearEspacio POST', async () => {
    const data = { nombre: 'Aula', capacidad: 30, tipoEspacioId: 1 };
    await espaciosApi.crearEspacio(data);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/espacios',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(data) }),
    );
  });

  it('actualizarEspacio PUT', async () => {
    const data = { nombre: 'Aula', capacidad: 30, tipoEspacioId: 1 };
    await espaciosApi.actualizarEspacio(2, data);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/espacios/2',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(data) }),
    );
  });

  it('eliminarEspacio DELETE', async () => {
    await espaciosApi.eliminarEspacio(2);
    expect(mockApiRequest).toHaveBeenCalledWith('/espacios/2', { method: 'DELETE' });
  });

  it('listarTiposEspacio GET', async () => {
    await espaciosApi.listarTiposEspacio();
    expect(mockApiRequest).toHaveBeenCalledWith('/tipos-espacio', { method: 'GET' });
  });

  it('crearTipoEspacio POST', async () => {
    await espaciosApi.crearTipoEspacio({ nombre: 'Aula' });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/tipos-espacio',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ nombre: 'Aula' }) }),
    );
  });

  it('actualizarTipoEspacio PUT', async () => {
    await espaciosApi.actualizarTipoEspacio(3, { nombre: 'Aula' });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/tipos-espacio/3',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ nombre: 'Aula' }) }),
    );
  });

  it('eliminarTipoEspacio DELETE', async () => {
    await espaciosApi.eliminarTipoEspacio(3);
    expect(mockApiRequest).toHaveBeenCalledWith('/tipos-espacio/3', { method: 'DELETE' });
  });

  it('obtenerEspacios GET', async () => {
    await espaciosApi.obtenerEspacios();
    expect(mockApiRequest).toHaveBeenCalledWith('/espacios', { method: 'GET' });
  });

  it('listarEdificios GET', async () => {
    await espaciosApi.listarEdificios();
    expect(mockApiRequest).toHaveBeenCalledWith('/edificios', { method: 'GET' });
  });

  it('eliminarImagenEspacio DELETE', async () => {
    await espaciosApi.eliminarImagenEspacio(8);
    expect(mockApiRequest).toHaveBeenCalledWith('/espacios/8/imagen', { method: 'DELETE' });
  });

  it('obtenerUrlImagenEspacio GET', async () => {
    await espaciosApi.obtenerUrlImagenEspacio(8);
    expect(mockApiRequest).toHaveBeenCalledWith('/espacios/8/imagen', { method: 'GET' });
  });

  it('obtenerEstadisticasEspacios GET', async () => {
    await espaciosApi.obtenerEstadisticasEspacios();
    expect(mockApiRequest).toHaveBeenCalledWith('/espacios/stats', { method: 'GET' });
  });

  describe('subirImagenEspacio', () => {
    it('uploads via raw fetch and returns parsed JSON', async () => {
      localStorage.setItem('token', 'tok');
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: { objectName: 'x', imageUrl: 'u' } }),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const file = new File(['data'], 'image.png', { type: 'image/png' });
      const result = await espaciosApi.subirImagenEspacio(4, file);

      expect(result.data?.imageUrl).toBe('u');
      const [url, config] = fetchMock.mock.calls[0];
      expect(url).toContain('/espacios/4/imagen');
      expect((config as RequestInit).method).toBe('POST');
      expect((config as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok' });
    });

    it('throws on non-ok response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'archivo invalido' }),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const file = new File(['x'], 'x.png');
      await expect(espaciosApi.subirImagenEspacio(4, file)).rejects.toThrow('archivo invalido');
    });
  });
});
