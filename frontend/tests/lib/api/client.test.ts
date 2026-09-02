import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, refreshToken, actuatorRequest, clearApiCache } from '@/lib/api/client';

const ORIGINAL_FETCH = globalThis.fetch;

interface MockResponseInit {
  status?: number;
  ok?: boolean;
  body?: unknown;
  contentType?: string | null;
  textBody?: string;
}

function makeResponse(init: MockResponseInit = {}): Response {
  const status = init.status ?? 200;
  const ok = init.ok ?? (status >= 200 && status < 300);
  const contentType = init.contentType === undefined ? 'application/json' : init.contentType;

  const headers = new Headers();
  if (contentType) headers.set('content-type', contentType);

  const json = vi.fn().mockResolvedValue(init.body ?? {});
  const text = vi.fn().mockResolvedValue(init.textBody ?? '');
  const clone = vi.fn();

  const response: Partial<Response> = {
    status,
    ok,
    headers,
    json: json as unknown as Response['json'],
    text: text as unknown as Response['text'],
  };

  clone.mockImplementation(() => makeResponse(init));
  response.clone = clone as unknown as Response['clone'];

  return response as Response;
}

describe('apiRequest', () => {
  beforeEach(() => {
    localStorage.clear();
    clearApiCache();
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it('returns parsed JSON when fetch responds OK', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(makeResponse({ body: { success: true, data: { foo: 'bar' } } }));

    const result = await apiRequest<{ foo: string }>('/ping');

    expect(result).toEqual({ success: true, data: { foo: 'bar' } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, config] = fetchMock.mock.calls[0];
    expect(url).toContain('/ping');
    expect((config as RequestInit).headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('attaches Authorization header when token is in localStorage', async () => {
    localStorage.setItem('token', 'tok-123');
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(makeResponse({ body: { success: true } }));

    await apiRequest('/ping');

    const [, config] = fetchMock.mock.calls[0];
    expect((config as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok-123' });
  });

  it('returns success:true when 204 No Content', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(makeResponse({ status: 204, contentType: null }));

    const result = await apiRequest('/no-content');
    expect(result).toEqual({ success: true });
  });

  it('throws an error with backend error message when response is not OK', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 400, ok: false, body: { success: false, error: 'campo requerido' } }),
    );

    await expect(apiRequest('/bad')).rejects.toThrow('campo requerido');
  });

  it('falls back to generic error message when no body is provided', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 500, ok: false, contentType: null }),
    );

    await expect(apiRequest('/boom')).rejects.toThrow('Error en la petición');
  });

  it('rethrows network errors', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    await expect(apiRequest('/x')).rejects.toThrow('network down');
  });

  it('does not attempt token refresh on auth endpoints', async () => {
    localStorage.setItem('token', 'tok');
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 401, ok: false, body: { error: 'jwt expired' } }),
    );

    await expect(apiRequest('/auth/login', { method: 'POST' })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('logs out and throws when 401 with jwt error and no refresh token', async () => {
    localStorage.setItem('token', 'tok');
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 401, ok: false, body: { error: 'jwt expired' } }),
    );
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');

    await expect(apiRequest('/protected')).rejects.toThrow(/sesión ha expirado/i);
    expect(dispatchSpy).toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('refreshes token and retries on 401 jwt error when refresh succeeds', async () => {
    localStorage.setItem('token', 'old-tok');
    localStorage.setItem('refreshToken', 'r-tok');
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // 1st call: original request returns 401 jwt expired
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 401, ok: false, body: { error: 'jwt expired' } }),
    );
    // 2nd call: refresh endpoint returns new tokens
    fetchMock.mockResolvedValueOnce(
      makeResponse({ body: { success: true, data: { token: 'new-tok', refreshToken: 'new-r' } } }),
    );
    // 3rd call: retried request succeeds
    fetchMock.mockResolvedValueOnce(makeResponse({ body: { success: true, data: 'ok' } }));

    const result = await apiRequest<string>('/protected');
    expect(result.data).toBe('ok');
    expect(localStorage.getItem('token')).toBe('new-tok');
  });
});

describe('refreshToken', () => {
  beforeEach(() => {
    localStorage.clear();
    clearApiCache();
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it('throws when no refresh token in storage', async () => {
    await expect(refreshToken()).rejects.toThrow('No hay refresh token disponible');
  });

  it('returns the new tokens on success', async () => {
    localStorage.setItem('refreshToken', 'r-tok');
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      makeResponse({ body: { success: true, data: { token: 'new', refreshToken: 'new-r' } } }),
    );

    const res = await refreshToken();
    expect(res.success).toBe(true);
    expect(res.data?.token).toBe('new');
  });

  it('throws when refresh endpoint returns error', async () => {
    localStorage.setItem('refreshToken', 'r-tok');
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 401, ok: false, body: { error: 'invalid refresh' } }),
    );

    await expect(refreshToken()).rejects.toThrow('invalid refresh');
  });
});

describe('actuatorRequest', () => {
  beforeEach(() => {
    localStorage.clear();
    clearApiCache();
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it('returns parsed JSON when ok', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(makeResponse({ body: { status: 'UP' } }));

    const result = await actuatorRequest('/actuator/health');
    expect(result).toEqual({ status: 'UP' });
  });

  it('returns text when content-type is text/plain', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      makeResponse({ contentType: 'text/plain', textBody: 'log line' }),
    );

    const result = await actuatorRequest('/actuator/logfile');
    expect(result).toBe('log line');
  });

  it('throws a Spanish error when not ok', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(makeResponse({ status: 403, ok: false }));

    await expect(actuatorRequest('/actuator/health')).rejects.toThrow(/Acceso denegado/);
  });

  it('attempts token refresh on 401 and retries', async () => {
    localStorage.setItem('refreshToken', 'r-tok');
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce(makeResponse({ status: 401, ok: false }));
    // refresh endpoint
    fetchMock.mockResolvedValueOnce(
      makeResponse({ body: { token: 'new-tok', refreshToken: 'new-r' } }),
    );
    // retried request
    fetchMock.mockResolvedValueOnce(makeResponse({ body: { status: 'UP' } }));

    const result = await actuatorRequest('/actuator/health');
    expect(result).toEqual({ status: 'UP' });
    expect(localStorage.getItem('token')).toBe('new-tok');
  });

  it('throws when 401 and no refresh token', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(makeResponse({ status: 401, ok: false }));

    await expect(actuatorRequest('/actuator/health')).rejects.toThrow(/Token expirado/);
  });
});
