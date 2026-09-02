import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api/spaces', () => ({
  espaciosApi: { obtenerEspacios: vi.fn() },
}));
vi.mock('@/lib/api/inventory', () => ({
  inventarioApi: { obtenerEstadisticasInventario: vi.fn() },
}));
vi.mock('@/lib/api/reservations', () => ({
  reservationsApi: {
    obtenerTodasLasReservas: vi.fn(),
    obtenerTodasReservasPaged: vi.fn(),
    obtenerMisReservas: vi.fn(),
    obtenerEstadisticasPersonales: vi.fn(),
  },
}));
vi.mock('@/lib/api/users', () => ({
  usuariosApi: { obtenerEstadisticas: vi.fn() },
}));
vi.mock('@/lib/api/stats', () => ({
  statsApi: { getActiveUsers: vi.fn() },
}));

import { dashboardApi } from '@/lib/api/dashboard';
import { apiRequest } from '@/lib/api/client';
import { espaciosApi } from '@/lib/api/spaces';
import { inventarioApi } from '@/lib/api/inventory';
import { reservationsApi } from '@/lib/api/reservations';
import { usuariosApi } from '@/lib/api/users';
import { statsApi } from '@/lib/api/stats';

const mockApiRequest = vi.mocked(apiRequest);
const mockObtenerEspacios = vi.mocked(espaciosApi.obtenerEspacios);
const mockInventarioStats = vi.mocked(inventarioApi.obtenerEstadisticasInventario);
const mockTodasReservas = vi.mocked(reservationsApi.obtenerTodasLasReservas);
const mockReservasPaged = vi.mocked(reservationsApi.obtenerTodasReservasPaged);
const mockMisReservas = vi.mocked(reservationsApi.obtenerMisReservas);
const mockReservaStats = vi.mocked(reservationsApi.obtenerEstadisticasPersonales);
const mockUserStats = vi.mocked(usuariosApi.obtenerEstadisticas);
const mockActiveUsers = vi.mocked(statsApi.getActiveUsers);

function setupDefaultMocks() {
  mockApiRequest.mockResolvedValue({
    success: true,
    data: { totalEspacios: 5, capacidadPromedio: 25 } as never,
  });
  mockObtenerEspacios.mockResolvedValue({
    success: true,
    data: [
      { id: 1, activo: true, estado: 'DISPONIBLE' },
      { id: 2, activo: true, estado: 'MANTENIMIENTO' },
    ] as never,
  });
  mockInventarioStats.mockResolvedValue({ success: true, data: {} as never });
  mockTodasReservas.mockResolvedValue({
    success: true,
    data: [
      { id: 1, estado: 'APROBADO', inicio: new Date(Date.now() + 3600_000).toISOString() },
      { id: 2, estado: 'PENDIENTE', inicio: new Date().toISOString() },
    ] as never,
  });
  mockReservasPaged.mockResolvedValue({
    success: true,
    data: {
      content: [
        { id: 1, estado: 'APROBADO', inicio: new Date(Date.now() + 3600_000).toISOString() },
      ],
      totalElements: 1,
    } as never,
  });
  mockMisReservas.mockResolvedValue({ success: true, data: [] as never });
  mockReservaStats.mockResolvedValue({ success: true, data: { total: 0 } as never });
  mockUserStats.mockResolvedValue({ totalUsuarios: 10 } as never);
  // getActiveUsers devuelve el objeto pelado, no envuelto en ApiResponse.
  mockActiveUsers.mockResolvedValue({ totalActiveUsers: 3 } as never);
}

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('obtenerDatosDashboard delegates to admin for ADMIN role', async () => {
    const result = await dashboardApi.obtenerDatosDashboard('ADMIN');
    expect(result.stats).toBeDefined();
    expect(result.stats.totalUsuarios).toBe(10);
  });

  it('obtenerDatosDashboard delegates to analista for ANALISTA role', async () => {
    const result = await dashboardApi.obtenerDatosDashboard('ANALISTA');
    expect(result.stats).toBeDefined();
  });

  it('obtenerDatosDashboard delegates to mantenimiento for MANTENIMIENTO', async () => {
    const result = await dashboardApi.obtenerDatosDashboard('MANTENIMIENTO');
    expect(result.stats.reservasHoy).toBe(0);
    expect(result.stats.reservasAprobadas).toBe(0);
  });

  it('obtenerDatosDashboard delegates to docente for DOCENTE', async () => {
    const result = await dashboardApi.obtenerDatosDashboard('DOCENTE');
    expect(result.stats).toBeDefined();
    expect(mockMisReservas).toHaveBeenCalled();
  });

  it('obtenerDatosDashboard delegates to estudiante for ESTUDIANTE', async () => {
    const result = await dashboardApi.obtenerDatosDashboard('ESTUDIANTE');
    expect(result.stats).toBeDefined();
  });

  it('obtenerDatosDashboard delegates to externo for EXTERNO', async () => {
    const result = await dashboardApi.obtenerDatosDashboard('EXTERNO');
    expect(result.stats).toBeDefined();
  });

  it('obtenerDatosDashboard defaults to estudiante when role unknown', async () => {
    const result = await dashboardApi.obtenerDatosDashboard('OTHER');
    expect(result.stats).toBeDefined();
  });

  it('obtenerDatosDashboardAdmin returns merged stats with espacios counts', async () => {
    const result = await dashboardApi.obtenerDatosDashboardAdmin();
    expect(result.stats.totalEspacios).toBe(5);
    expect(result.stats.espaciosDisponibles).toBe(1);
    expect(result.stats.espaciosEnMantenimiento).toBe(1);
    expect(result.espacios).toHaveLength(2);
  });

  it('obtenerDatosDashboardAnalista does not include userStats', async () => {
    const result = await dashboardApi.obtenerDatosDashboardAnalista();
    expect(result.stats.totalUsuarios).toBe(0);
  });

  it('obtenerDatosDashboardMantenimiento zeroes reservation counters', async () => {
    const result = await dashboardApi.obtenerDatosDashboardMantenimiento();
    expect(result.stats.reservasPendientes).toBe(0);
    expect(result.stats.reservasAprobadas).toBe(0);
    expect(result.stats.reservasCanceladas).toBe(0);
    expect(result.proximasReservas).toEqual([]);
  });

  it('obtenerDatosDashboardDocente uses misReservas', async () => {
    await dashboardApi.obtenerDatosDashboardDocente();
    expect(mockMisReservas).toHaveBeenCalled();
  });

  it('obtenerDatosDashboardEstudiante returns spaces and reservations', async () => {
    const result = await dashboardApi.obtenerDatosDashboardEstudiante();
    expect(result.espacios).toHaveLength(2);
  });

  it('obtenerDatosDashboardExterno overrides reservasPendientes with personal pending', async () => {
    mockMisReservas.mockResolvedValueOnce({
      success: true,
      data: [{ id: 1, estado: 'PENDIENTE', inicio: new Date().toISOString() }] as never,
    });
    const result = await dashboardApi.obtenerDatosDashboardExterno();
    expect(result.stats.reservasPendientes).toBe(1);
  });

  it('admin dashboard tolerates rejected dependencies', async () => {
    mockUserStats.mockRejectedValueOnce(new Error('boom'));
    mockReservaStats.mockRejectedValueOnce(new Error('boom'));
    mockActiveUsers.mockRejectedValueOnce(new Error('boom'));
    mockInventarioStats.mockRejectedValueOnce(new Error('boom'));

    const result = await dashboardApi.obtenerDatosDashboardAdmin();
    expect(result.stats).toBeDefined();
    // userStats fell back to 0
    expect(result.stats.totalUsuarios).toBe(0);
  });

});
