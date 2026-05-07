import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '@/lib/api/auth';
import { apiRequest } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  apiRequest: vi.fn(),
}));

const mockApiRequest = vi.mocked(apiRequest);

describe('authApi', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ success: true });
  });

  it('login posts credentials to /auth/login', async () => {
    await authApi.login({ email: 'a@b.com', password: 'pw' });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'pw' }),
      }),
    );
  });

  it('register posts user data to /auth/register', async () => {
    const data = {
      nombre: 'A',
      apellido: 'B',
      email: 'a@b.com',
      password: 'pw',
      confirmPassword: 'pw',
    };
    await authApi.register(data);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(data) }),
    );
  });

  it('logout posts to /auth/logout', async () => {
    await authApi.logout();
    expect(mockApiRequest).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
  });

  it('verifyToken sends GET /auth/verify', async () => {
    await authApi.verifyToken();
    expect(mockApiRequest).toHaveBeenCalledWith('/auth/verify', { method: 'GET' });
  });

  it('verifyEmail posts token to /auth/verify-email', async () => {
    await authApi.verifyEmail('abc');
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/verify-email',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: 'abc' }) }),
    );
  });

  it('resendVerificationEmail posts email', async () => {
    await authApi.resendVerificationEmail('a@b.com');
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/resend-verification',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'a@b.com' }) }),
    );
  });

  it('forgotPassword posts email', async () => {
    await authApi.forgotPassword('a@b.com');
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/forgot-password',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'a@b.com' }) }),
    );
  });

  it('resetPassword posts token and new password', async () => {
    await authApi.resetPassword('tok', 'newpw');
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/reset-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'tok', newPassword: 'newpw' }),
      }),
    );
  });
});
