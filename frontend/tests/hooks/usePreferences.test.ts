import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePreferences } from '@/hooks/usePreferences';
import { preferencesApi } from '@/lib/api/preferences';

vi.mock('@/lib/api/preferences', () => ({
  preferencesApi: { obtenerPreferencias: vi.fn() },
}));

const mockApi = vi.mocked(preferencesApi.obtenerPreferencias);

describe('usePreferences', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });

  it('carga preferencias del usuario', async () => {
    mockApi.mockResolvedValueOnce({
      data: {
        preferencias: {
          vista: {
            reservasViewMode: 'list',
            reservasCalendarViewMode: 'month',
            reservasPageSize: 5,
            espaciosViewMode: 'table',
            espaciosPageSize: 6,
            inventarioViewMode: 'cards',
            inventarioPageSize: 7,
            usuariosPageSize: 8,
            auditoriaPageSize: 9,
          },
        },
      },
    } as never);
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.preferencias?.reservasViewMode).toBe('list');
    expect(result.current.error).toBeNull();
  });

  it('usa valores por defecto si no hay preferencias', async () => {
    mockApi.mockResolvedValueOnce({ data: { preferencias: {} } } as never);
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.preferencias?.reservasViewMode).toBe('calendar');
    expect(result.current.preferencias?.espaciosPageSize).toBe(12);
  });

  it('usa valores por defecto si la API falla', async () => {
    mockApi.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.preferencias?.reservasViewMode).toBe('calendar');
    expect(result.current.error).toBe('boom');
  });
});
