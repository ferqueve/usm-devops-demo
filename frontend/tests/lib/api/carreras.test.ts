import { describe, it, expect, vi, beforeEach } from 'vitest';
import { carrerasApi } from '@/lib/api/carreras';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);

describe('carrerasApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true });
  });

  it('obtenerCarreras GET /carreras', async () => {
    await carrerasApi.obtenerCarreras();
    expect(mockApiRequest).toHaveBeenCalledWith('/carreras', { method: 'GET' });
  });

  it('obtenerCarrera GET /carreras/:id', async () => {
    await carrerasApi.obtenerCarrera(5);
    expect(mockApiRequest).toHaveBeenCalledWith('/carreras/5', { method: 'GET' });
  });

  it('crearCarrera POST /carreras with body', async () => {
    await carrerasApi.crearCarrera({ nombre: 'Ing', codigo: 'I-1' });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/carreras',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nombre: 'Ing', codigo: 'I-1' }),
      }),
    );
  });

  it('actualizarCarrera PUT /carreras/:id with body', async () => {
    await carrerasApi.actualizarCarrera(3, { nombre: 'X' });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/carreras/3',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ nombre: 'X' }) }),
    );
  });

  it('eliminarCarrera DELETE /carreras/:id', async () => {
    await carrerasApi.eliminarCarrera(9);
    expect(mockApiRequest).toHaveBeenCalledWith('/carreras/9', { method: 'DELETE' });
  });

  it('buscarCarrerasPorNombre encodes the query', async () => {
    await carrerasApi.buscarCarrerasPorNombre('inge química');
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toBe(`/carreras/search?nombre=${encodeURIComponent('inge química')}`);
  });
});
