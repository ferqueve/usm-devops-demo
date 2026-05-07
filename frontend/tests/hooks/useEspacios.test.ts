import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEspacios, invalidateEspaciosCache } from '@/hooks/useEspacios';
import { espaciosApi } from '@/lib/api/spaces';

vi.mock('@/lib/api/spaces', () => ({
  espaciosApi: { obtenerEspacios: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockApi = vi.mocked(espaciosApi.obtenerEspacios);

describe('useEspacios', () => {
  beforeEach(() => {
    invalidateEspaciosCache();
    mockApi.mockReset();
  });

  it('carga espacios al montar', async () => {
    mockApi.mockResolvedValueOnce({ data: [{ id: 1, nombre: 'A' }] } as never);
    const { result } = renderHook(() => useEspacios());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.espacios).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('expone error si la API falla', async () => {
    mockApi.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useEspacios());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('refresh fuerza nueva petición e invalida caché', async () => {
    mockApi.mockResolvedValueOnce({ data: [{ id: 1 }] } as never);
    const { result } = renderHook(() => useEspacios());
    await waitFor(() => expect(result.current.espacios).toHaveLength(1));

    mockApi.mockResolvedValueOnce({ data: [{ id: 2 }, { id: 3 }] } as never);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.espacios).toHaveLength(2);
    expect(mockApi).toHaveBeenCalledTimes(2);
  });

  it('usa caché entre montajes consecutivos', async () => {
    mockApi.mockResolvedValueOnce({ data: [{ id: 1 }] } as never);
    const first = renderHook(() => useEspacios());
    await waitFor(() => expect(first.result.current.espacios).toHaveLength(1));

    const second = renderHook(() => useEspacios());
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(mockApi).toHaveBeenCalledTimes(1);
  });
});
