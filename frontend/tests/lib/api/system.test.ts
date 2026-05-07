import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { actuatorApi } from '@/lib/api/system';
import { actuatorRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ actuatorRequest: vi.fn() }));

const mockActuatorRequest = vi.mocked(actuatorRequest);
const ORIGINAL_FETCH = globalThis.fetch;

describe('actuatorApi', () => {
  beforeEach(() => {
    mockActuatorRequest.mockReset();
    mockActuatorRequest.mockResolvedValue({});
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it('getHealth GET /actuator/health', async () => {
    await actuatorApi.getHealth();
    expect(mockActuatorRequest).toHaveBeenCalledWith('/actuator/health');
  });

  it('getMetrics GET /actuator/metrics', async () => {
    await actuatorApi.getMetrics();
    expect(mockActuatorRequest).toHaveBeenCalledWith('/actuator/metrics');
  });

  it('getMetric appends metricName', async () => {
    await actuatorApi.getMetric('jvm.memory.used');
    expect(mockActuatorRequest).toHaveBeenCalledWith('/actuator/metrics/jvm.memory.used');
  });

  it('getInfo /actuator/info', async () => {
    await actuatorApi.getInfo();
    expect(mockActuatorRequest).toHaveBeenCalledWith('/actuator/info');
  });

  it('getEndpoints /actuator', async () => {
    await actuatorApi.getEndpoints();
    expect(mockActuatorRequest).toHaveBeenCalledWith('/actuator');
  });

  it('getHttpTrace /actuator/httpexchanges', async () => {
    await actuatorApi.getHttpTrace();
    expect(mockActuatorRequest).toHaveBeenCalledWith('/actuator/httpexchanges');
  });

  it('getMappings /actuator/mappings', async () => {
    await actuatorApi.getMappings();
    expect(mockActuatorRequest).toHaveBeenCalledWith('/actuator/mappings');
  });

  it('getOpenApiDocs /v3/api-docs', async () => {
    await actuatorApi.getOpenApiDocs();
    expect(mockActuatorRequest).toHaveBeenCalledWith('/v3/api-docs');
  });

  it('getLiquibase /actuator/liquibase', async () => {
    await actuatorApi.getLiquibase();
    expect(mockActuatorRequest).toHaveBeenCalledWith('/actuator/liquibase');
  });

  it('getLoggers /actuator/loggers', async () => {
    await actuatorApi.getLoggers();
    expect(mockActuatorRequest).toHaveBeenCalledWith('/actuator/loggers');
  });

  it('getLogFile /actuator/logfile', async () => {
    await actuatorApi.getLogFile();
    expect(mockActuatorRequest).toHaveBeenCalledWith('/actuator/logfile');
  });

  describe('setLoggerLevel', () => {
    it('uses raw fetch with token to POST level', async () => {
      localStorage.setItem('token', 'tok');
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true }),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      await actuatorApi.setLoggerLevel('com.example', 'DEBUG');
      const [url, config] = fetchMock.mock.calls[0];
      expect(url).toContain('/actuator/loggers/com.example');
      expect((config as RequestInit).method).toBe('POST');
      expect((config as RequestInit).body).toBe(JSON.stringify({ configuredLevel: 'DEBUG' }));
      expect((config as RequestInit).headers).toMatchObject({
        Authorization: 'Bearer tok',
        'Content-Type': 'application/json',
      });
    });

    it('throws translated error on non-ok response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403 });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      await expect(actuatorApi.setLoggerLevel('a', 'INFO')).rejects.toThrow(/Acceso denegado/);
    });
  });
});
