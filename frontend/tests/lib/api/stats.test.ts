import { describe, it, expect, vi, beforeEach } from 'vitest';
import { statsApi } from '@/lib/api/stats';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);

describe('statsApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true });
  });

  it('getActiveUsers calls GET /stats/active-users', async () => {
    await statsApi.getActiveUsers();
    expect(mockApiRequest).toHaveBeenCalledWith('/stats/active-users', { method: 'GET' });
  });
});
