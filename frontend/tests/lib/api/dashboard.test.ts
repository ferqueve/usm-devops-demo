import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

import { dashboardApi, resumenEspacios, type DashboardStats } from '@/lib/api/dashboard';
import { apiRequest } from '@/lib/api/client';

const mockApiRequest = vi.mocked(apiRequest);

const STATS: DashboardStats = {
  totalReservas: 42,
  reservasHoy: 3,
  reservasPendientes: 5,
  reservasAprobadas: 30,
  reservasCanceladas: 7,
  totalEspacios: 10,
  espaciosDisponibles: 8,
  espaciosOcupados: 1,
  espaciosEnMantenimiento: 1,
  capacidadPromedio: 25,
  totalUsuarios: 100,
  usuariosActivos: 4,
  usuariosNuevosHoy: 0,
  promedioReservasPorEspacio: 3,
};

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pide el dashboard en una sola llamada', async () => {
    mockApiRequest.mockResolvedValue({
      success: true,
      data: { stats: STATS, proximasReservas: [], misReservas: [], reservasPendientes: [], solicitudesInventarioPendientes: 2 },
    } as never);

    const result = await dashboardApi.obtenerDatosDashboard();

    expect(mockApiRequest).toHaveBeenCalledTimes(1);
    expect(mockApiRequest).toHaveBeenCalledWith('/dashboard', { method: 'GET' });
    expect(result.stats.totalReservas).toBe(42);
    expect(result.solicitudesInventarioPendientes).toBe(2);
  });

  // Una respuesta sin cuerpo no debe romper la pantalla: se dibuja en cero.
  it('devuelve el dashboard vacio si la respuesta no trae datos', async () => {
    mockApiRequest.mockResolvedValue({ success: true } as never);

    const result = await dashboardApi.obtenerDatosDashboard();

    expect(result.stats.totalReservas).toBe(0);
    expect(result.proximasReservas).toEqual([]);
    expect(result.misReservas).toEqual([]);
  });

  it('propaga el error para que la pantalla avise', async () => {
    mockApiRequest.mockRejectedValue(new Error('sin conexion'));

    await expect(dashboardApi.obtenerDatosDashboard()).rejects.toThrow('sin conexion');
  });
});

describe('resumenEspacios', () => {
  it('arma el resumen que muestra mantenimiento', () => {
    expect(resumenEspacios(STATS)).toEqual({
      totalEspacios: 10,
      disponibles: 8,
      enMantenimiento: 1,
      ocupados: 1,
    });
  });

  it('sin stats no hay resumen', () => {
    expect(resumenEspacios(undefined)).toBeNull();
  });
});
