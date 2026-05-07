import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthContext, type AuthContextType } from '@/contexts/authContext';

const baseContext: AuthContextType = {
  isAuthenticated: true,
  isLoading: false,
  user: { id: 1, email: 'a@b.com', nombre: 'A', rol: 'ADMIN' },
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  error: null,
  registrationSuccess: false,
  setRegistrationSuccess: () => {},
  lastRegisteredEmail: '',
};

describe('useAuth', () => {
  it('retorna el contexto cuando está dentro de AuthProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthContext.Provider, { value: baseContext }, children);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user?.email).toBe('a@b.com');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('lanza error si no hay AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });
});
