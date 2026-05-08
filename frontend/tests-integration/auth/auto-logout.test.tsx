import { describe, it, expect } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { loginAs } from '../helpers/auth';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Auto-logout on auth:logout event', () => {
  it('cuando se dispara auth:logout limpia user y muestra mensaje de sesión expirada', async () => {
    loginAs('ADMIN');

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Esperar a que el AuthProvider termine de inicializar (verifyToken)
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    act(() => {
      globalThis.dispatchEvent(new CustomEvent('auth:logout'));
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.error).toMatch(/sesión ha expirado/i);
  });
});
