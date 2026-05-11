import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reservationsApi } from '@/lib/api/reservations';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);

describe('reservationsApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true });
  });

  it('crearReserva POST /reservas', async () => {
    const data = {
      espacioId: 1,
      inicio: '2024-01-01T10:00:00Z',
      fin: '2024-01-01T12:00:00Z',
      titulo: 'Clase',
    };
    await reservationsApi.crearReserva(data);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/reservas',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(data) }),
    );
  });

  it('obtenerMisReservas GET', async () => {
    await reservationsApi.obtenerMisReservas();
    expect(mockApiRequest).toHaveBeenCalledWith('/reservas/mis-reservas', { method: 'GET' });
  });

  it('obtenerMisReservasPaged builds full query', async () => {
    await reservationsApi.obtenerMisReservasPaged({
      page: 1,
      size: 5,
      estado: 'PENDIENTE',
      espacioId: 2,
      carreraId: 3,
      tipoEspacioId: 4,
      fechaInicio: new Date('2024-01-01T00:00:00Z'),
      fechaFin: new Date('2024-12-31T00:00:00Z'),
      tiempo: 'futuras',
    });
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('/reservas/mis-reservas/paged?');
    expect(url).toContain('page=1');
    expect(url).toContain('size=5');
    expect(url).toContain('estado=PENDIENTE');
    expect(url).toContain('espacioId=2');
    expect(url).toContain('carreraId=3');
    expect(url).toContain('tipoEspacioId=4');
    expect(url).toContain('fechaInicio=');
    expect(url).toContain('tiempo=futuras');
  });

  it('obtenerMisReservasPaged ignores estado="todas" and tiempo="todas"', async () => {
    await reservationsApi.obtenerMisReservasPaged({ estado: 'todas', tiempo: 'todas' });
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).not.toContain('estado=');
    expect(url).not.toContain('tiempo=');
  });

  it('obtenerReserva GET /reservas/:id', async () => {
    await reservationsApi.obtenerReserva(1);
    expect(mockApiRequest).toHaveBeenCalledWith('/reservas/1', { method: 'GET' });
  });

  it('cancelarReserva DELETE', async () => {
    await reservationsApi.cancelarReserva(3);
    expect(mockApiRequest).toHaveBeenCalledWith('/reservas/3', { method: 'DELETE' });
  });

  it('obtenerReservasPorEspacio GET', async () => {
    await reservationsApi.obtenerReservasPorEspacio(8);
    expect(mockApiRequest).toHaveBeenCalledWith('/reservas/espacio/8', { method: 'GET' });
  });

  it('obtenerTodasLasReservas without filters uses bare path', async () => {
    await reservationsApi.obtenerTodasLasReservas();
    expect(mockApiRequest).toHaveBeenCalledWith('/reservas/todas', { method: 'GET' });
  });

  it('obtenerTodasLasReservas with filters builds query', async () => {
    await reservationsApi.obtenerTodasLasReservas(
      'PENDIENTE',
      1,
      2,
      3,
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-12-31T00:00:00Z'),
    );
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('estado=PENDIENTE');
    expect(url).toContain('espacioId=1');
    expect(url).toContain('carreraId=2');
    expect(url).toContain('tipoEspacioId=3');
    expect(url).toContain('fechaInicio=');
    expect(url).toContain('fechaFin=');
  });

  it('obtenerTodasLasReservas ignores estado="todas"', async () => {
    await reservationsApi.obtenerTodasLasReservas('todas');
    expect(mockApiRequest).toHaveBeenCalledWith('/reservas/todas', { method: 'GET' });
  });

  it('obtenerTodasReservasPaged includes usuarioId', async () => {
    await reservationsApi.obtenerTodasReservasPaged({ usuarioId: 9 });
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('/reservas/paged?');
    expect(url).toContain('usuarioId=9');
  });

  it('aprobarReserva PATCH with APROBADO', async () => {
    await reservationsApi.aprobarReserva(5);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/reservas/5/estado',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ estado: 'APROBADO' }) }),
    );
  });

  it('rechazarReserva PATCH with mensaje when provided', async () => {
    await reservationsApi.rechazarReserva(5, '  motivo  ');
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/reservas/5/estado',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ estado: 'CANCELADO', mensajeAnalista: 'motivo' }),
      }),
    );
  });

  it('rechazarReserva omits mensaje when blank', async () => {
    await reservationsApi.rechazarReserva(5, '   ');
    const [, opts] = mockApiRequest.mock.calls[0];
    expect((opts as RequestInit).body).toBe(JSON.stringify({ estado: 'CANCELADO' }));
  });

  it('cambiarEstadoReserva PATCH', async () => {
    await reservationsApi.cambiarEstadoReserva(7, 'APROBADO');
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/reservas/7/estado',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ estado: 'APROBADO' }) }),
    );
  });

  it('obtenerEstadisticasPersonales GET', async () => {
    await reservationsApi.obtenerEstadisticasPersonales();
    expect(mockApiRequest).toHaveBeenCalledWith('/reservas/mis-reservas/stats', { method: 'GET' });
  });

  it('listarSolicitudesInventario builds full query', async () => {
    await reservationsApi.listarSolicitudesInventario({
      page: 2,
      size: 10,
      estados: ['PENDIENTE', 'APROBADO'],
      espacioId: 4,
      fechaDesde: new Date('2024-01-01T00:00:00Z'),
      fechaHasta: '2024-06-01T00:00:00Z',
      search: 'mic',
      sortField: 'fecha',
      sortDirection: 'asc',
    });
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('/reservas/items-solicitados?');
    expect(url).toContain('page=2');
    expect(url).toContain('size=10');
    expect(url).toContain('estado=PENDIENTE');
    expect(url).toContain('estado=APROBADO');
    expect(url).toContain('espacioId=4');
    expect(url).toContain('fechaDesde=');
    expect(url).toContain('fechaHasta=');
    expect(url).toContain('search=mic');
    expect(url).toContain('sort=fecha%2Casc');
  });

  it('listarSolicitudesInventario uses defaults', async () => {
    await reservationsApi.listarSolicitudesInventario();
    const [url] = mockApiRequest.mock.calls[0];
    expect(url).toContain('page=0');
    expect(url).toContain('size=20');
  });

  it('actualizarSolicitudInventario PATCH with payload', async () => {
    await reservationsApi.actualizarSolicitudInventario(3, {
      estado: 'APROBADO',
      inventarioItemId: 7,
      observaciones: 'ok',
    });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/reservas/items-solicitados/3',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ estado: 'APROBADO', inventarioItemId: 7, observaciones: 'ok' }),
      }),
    );
  });

  it('actualizarSolicitudInventario allows null inventarioItemId and observaciones', async () => {
    await reservationsApi.actualizarSolicitudInventario(3, {
      inventarioItemId: null,
      observaciones: null,
    });
    const [, opts] = mockApiRequest.mock.calls[0];
    expect((opts as RequestInit).body).toBe(
      JSON.stringify({ inventarioItemId: null, observaciones: null }),
    );
  });
});
