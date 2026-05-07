import { describe, it, expect, vi, beforeEach } from 'vitest';
import { preferencesApi } from '@/lib/api/preferences';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);

describe('preferencesApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true });
  });

  it('obtenerPreferencias GET /preferencias', async () => {
    await preferencesApi.obtenerPreferencias();
    expect(mockApiRequest).toHaveBeenCalledWith('/preferencias', { method: 'GET' });
  });

  it('obtenerPreferenciasEmail GET /preferencias/email', async () => {
    await preferencesApi.obtenerPreferenciasEmail();
    expect(mockApiRequest).toHaveBeenCalledWith('/preferencias/email', { method: 'GET' });
  });

  it('obtenerPreferenciasVista GET /preferencias/vista', async () => {
    await preferencesApi.obtenerPreferenciasVista();
    expect(mockApiRequest).toHaveBeenCalledWith('/preferencias/vista', { method: 'GET' });
  });

  it('actualizarPreferenciasEmail PUT', async () => {
    const body = { email: { reservaCreada: true } };
    await preferencesApi.actualizarPreferenciasEmail(body);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/preferencias/email',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) }),
    );
  });

  it('actualizarPreferenciasVista PUT', async () => {
    const body = { vista: { reservasViewMode: 'cards' as const } };
    await preferencesApi.actualizarPreferenciasVista(body);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/preferencias/vista',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) }),
    );
  });

  it('obtenerEmailsObligatorios GET', async () => {
    await preferencesApi.obtenerEmailsObligatorios();
    expect(mockApiRequest).toHaveBeenCalledWith('/preferencias/email/obligatorios', { method: 'GET' });
  });
});
