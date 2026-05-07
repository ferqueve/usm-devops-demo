import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRecomendacionesDashboard } from '@/hooks/useRecomendaciones';
import { recomendacionesApi } from '@/lib/api/recomendaciones';

vi.mock('@/lib/api/recomendaciones', () => ({
  recomendacionesApi: { obtenerRecomendacionesDashboard: vi.fn() },
}));

const mockApi = vi.mocked(recomendacionesApi.obtenerRecomendacionesDashboard);

describe('useRecomendacionesDashboard', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });

  it('carga recomendaciones al montar (success)', async () => {
    mockApi.mockResolvedValueOnce({
      success: true,
      data: { espaciosRecomendados: [], horariosOptimos: [] },
    } as never);
    const { result } = renderHook(() => useRecomendacionesDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recomendaciones).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('setea error si success=false', async () => {
    mockApi.mockResolvedValueOnce({ success: false, error: 'mensaje' } as never);
    const { result } = renderHook(() => useRecomendacionesDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('mensaje');
  });

  it('captura excepción de la API', async () => {
    mockApi.mockRejectedValueOnce(new Error('falla'));
    const { result } = renderHook(() => useRecomendacionesDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('falla');
  });

  it('refetch vuelve a llamar a la API', async () => {
    mockApi.mockResolvedValueOnce({ success: true, data: { a: 1 } } as never);
    const { result } = renderHook(() => useRecomendacionesDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApi).toHaveBeenCalledTimes(1);

    mockApi.mockResolvedValueOnce({ success: true, data: { a: 2 } } as never);
    await act(async () => {
      await result.current.refetch();
    });
    expect(mockApi).toHaveBeenCalledTimes(2);
  });
});
