import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usuariosApi } from '@/lib/api/users';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);
const ORIGINAL_FETCH = globalThis.fetch;

describe('usuariosApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true });
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it('listarUsuarios builds query with all filters', async () => {
    await usuariosApi.listarUsuarios(2, 5, {
      search: 'foo',
      rol: 'ADMIN',
      verificado: true,
      activo: false,
      fechaDesde: '2024-01-01',
      fechaHasta: '2024-12-31',
    });
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('/usuarios?');
    expect(url).toContain('page=2');
    expect(url).toContain('size=5');
    expect(url).toContain('search=foo');
    expect(url).toContain('rol=ADMIN');
    expect(url).toContain('verificado=true');
    expect(url).toContain('activo=false');
    expect(url).toContain('fechaDesde=2024-01-01');
    expect(url).toContain('fechaHasta=2024-12-31');
  });

  it('listarUsuarios uses defaults', async () => {
    await usuariosApi.listarUsuarios();
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('page=0');
    expect(url).toContain('size=10');
  });

  it('cambiarRol PUT', async () => {
    await usuariosApi.cambiarRol(7, 'ADMIN');
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/usuarios/7/rol',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ rolApp: 'ADMIN' }) }),
    );
  });

  it('toggleActivo PUT', async () => {
    await usuariosApi.toggleActivo(7);
    expect(mockApiRequest).toHaveBeenCalledWith('/usuarios/7/toggle-activo', { method: 'PUT' });
  });

  it('obtenerEstadisticas extracts data when wrapped', async () => {
    mockApiRequest.mockResolvedValueOnce({
      success: true,
      data: { totalUsuarios: 10 } as never,
    });
    const result = await usuariosApi.obtenerEstadisticas();
    expect(result).toEqual({ totalUsuarios: 10 });
  });

  it('obtenerEstadisticas falls back to result when not wrapped', async () => {
    mockApiRequest.mockResolvedValueOnce({ totalUsuarios: 5 } as never);
    const result = await usuariosApi.obtenerEstadisticas();
    expect(result).toMatchObject({ totalUsuarios: 5 });
  });

  describe('exportarUsuarios', () => {
    it('returns blob on success', async () => {
      localStorage.setItem('token', 'tok');
      const blob = new Blob(['csv'], { type: 'text/csv' });
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(blob),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const result = await usuariosApi.exportarUsuarios({ search: 'a' });
      expect(result).toBe(blob);
      const [url, config] = fetchMock.mock.calls[0];
      expect(url).toContain('/usuarios/export');
      expect(url).toContain('search=a');
      expect((config as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok' });
    });

    it('throws on non-ok response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: false });
      globalThis.fetch = fetchMock as unknown as typeof fetch;
      await expect(usuariosApi.exportarUsuarios()).rejects.toThrow('Error al exportar usuarios');
    });
  });

  it('actualizarUsuario PUT', async () => {
    await usuariosApi.actualizarUsuario(7, { nombre: 'X' } as never);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/usuarios/7',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ nombre: 'X' }) }),
    );
  });

  it('reenviarVerificacion POST', async () => {
    await usuariosApi.reenviarVerificacion(2);
    expect(mockApiRequest).toHaveBeenCalledWith('/usuarios/2/resend-verification', {
      method: 'POST',
    });
  });

  it('restablecerPassword POST', async () => {
    await usuariosApi.restablecerPassword(2);
    expect(mockApiRequest).toHaveBeenCalledWith('/usuarios/2/reset-password', { method: 'POST' });
  });

  it('listarAnalistas GET', async () => {
    await usuariosApi.listarAnalistas();
    expect(mockApiRequest).toHaveBeenCalledWith('/usuarios/analistas', { method: 'GET' });
  });

  it('obtenerPerfilPropio GET', async () => {
    await usuariosApi.obtenerPerfilPropio();
    expect(mockApiRequest).toHaveBeenCalledWith('/usuarios/me', { method: 'GET' });
  });

  it('actualizarPerfilPropio PUT', async () => {
    await usuariosApi.actualizarPerfilPropio({ nombre: 'X' } as never);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/usuarios/me',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ nombre: 'X' }) }),
    );
  });
});
