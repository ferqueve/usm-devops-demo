import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCarreras, invalidateCarrerasCache } from '@/hooks/useCarreras';
import { carrerasApi } from '@/lib/api/carreras';

vi.mock('@/lib/api/carreras', () => ({
  carrerasApi: { obtenerCarreras: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockApi = vi.mocked(carrerasApi.obtenerCarreras);

describe('useCarreras', () => {
  beforeEach(() => {
    invalidateCarrerasCache();
    mockApi.mockReset();
  });

  it('carga carreras al montar', async () => {
    mockApi.mockResolvedValueOnce({ data: [{ id: 1, nombre: 'Ing' }] } as never);
    const { result } = renderHook(() => useCarreras());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.carreras).toHaveLength(1);
  });

  it('refresh recarga datos', async () => {
    mockApi.mockResolvedValueOnce({ data: [{ id: 1 }] } as never);
    const { result } = renderHook(() => useCarreras());
    await waitFor(() => expect(result.current.carreras).toHaveLength(1));

    mockApi.mockResolvedValueOnce({ data: [{ id: 2 }, { id: 3 }] } as never);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.carreras).toHaveLength(2);
  });

  it('captura error al fallar la API', async () => {
    mockApi.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useCarreras());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
