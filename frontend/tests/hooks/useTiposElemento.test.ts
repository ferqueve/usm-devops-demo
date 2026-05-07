import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTiposElemento, invalidateTiposElementoCache } from '@/hooks/useTiposElemento';
import { inventarioApi } from '@/lib/api/inventory';

vi.mock('@/lib/api/inventory', () => ({
  inventarioApi: { listarTiposElemento: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockApi = vi.mocked(inventarioApi.listarTiposElemento);

describe('useTiposElemento', () => {
  beforeEach(() => {
    invalidateTiposElementoCache();
    mockApi.mockReset();
  });

  it('carga tipos al montar', async () => {
    mockApi.mockResolvedValueOnce({ data: [{ id: 1, nombre: 'Mesa' }] } as never);
    const { result } = renderHook(() => useTiposElemento());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tiposElemento).toHaveLength(1);
  });

  it('expone error si falla', async () => {
    mockApi.mockRejectedValueOnce(new Error('x'));
    const { result } = renderHook(() => useTiposElemento());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('refresh fuerza nueva carga', async () => {
    mockApi.mockResolvedValueOnce({ data: [{ id: 1 }] } as never);
    const { result } = renderHook(() => useTiposElemento());
    await waitFor(() => expect(result.current.tiposElemento).toHaveLength(1));

    mockApi.mockResolvedValueOnce({ data: [{ id: 2 }, { id: 3 }] } as never);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.tiposElemento).toHaveLength(2);
  });
});
