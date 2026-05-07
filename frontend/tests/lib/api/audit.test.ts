import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditApi } from '@/lib/api/audit';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);

describe('auditApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
  });

  describe('listarLogsAuditoria', () => {
    it('builds query with all filters and returns data', async () => {
      mockApiRequest.mockResolvedValueOnce({
        success: true,
        data: { content: [], totalElements: 0 } as never,
      });

      const result = await auditApi.listarLogsAuditoria(
        {
          entidad: 'Reserva',
          usuarioId: 7,
          accion: 'CREATE',
          fechaDesde: '2024-01-01',
          fechaHasta: '2024-12-31',
          search: 'foo',
        },
        2,
        50,
      );

      expect(result).toEqual({ content: [], totalElements: 0 });
      const [url, opts] = mockApiRequest.mock.calls[0];
      expect(url).toContain('entidad=Reserva');
      expect(url).toContain('usuarioId=7');
      expect(url).toContain('accion=CREATE');
      expect(url).toContain('fechaDesde=2024-01-01');
      expect(url).toContain('fechaHasta=2024-12-31');
      expect(url).toContain('search=foo');
      expect(url).toContain('page=2');
      expect(url).toContain('size=50');
      expect(opts).toEqual({ method: 'GET' });
    });

    it('uses default page/size and no filters', async () => {
      mockApiRequest.mockResolvedValueOnce({ success: true, data: { content: [] } as never });
      await auditApi.listarLogsAuditoria();
      const [url] = mockApiRequest.mock.calls[0];
      expect(url).toContain('page=0');
      expect(url).toContain('size=20');
    });

    it('throws when no data returned', async () => {
      mockApiRequest.mockResolvedValueOnce({ success: true });
      await expect(auditApi.listarLogsAuditoria()).rejects.toThrow('No se recibieron datos de la API');
    });
  });

  describe('obtenerLogAuditoria', () => {
    it('GETs /audit/:id and returns data', async () => {
      mockApiRequest.mockResolvedValueOnce({ success: true, data: { id: 1 } as never });
      const result = await auditApi.obtenerLogAuditoria(1);
      expect(mockApiRequest).toHaveBeenCalledWith('/audit/1', { method: 'GET' });
      expect(result).toEqual({ id: 1 });
    });

    it('throws when no data', async () => {
      mockApiRequest.mockResolvedValueOnce({ success: true });
      await expect(auditApi.obtenerLogAuditoria(1)).rejects.toThrow('No se recibieron datos de la API');
    });
  });
});
