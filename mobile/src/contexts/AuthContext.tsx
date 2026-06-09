import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { authApi } from '../lib/api';
import { API_HOST, clearSession, setSession, setUnauthorizedHandler, STORAGE_KEYS } from '../lib/http';
import type { SessionUser, UserRole } from '../lib/types';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    await authApi.logout();
    await clearSession();
    setUser(null);
  }, []);

  // Carga inicial de sesión desde AsyncStorage (optimista: si hay user, lo mostramos ya).
  useEffect(() => {
    (async () => {
      try {
        const [token, rawUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.token),
          AsyncStorage.getItem(STORAGE_KEYS.user),
        ]);
        if (token && rawUser) {
          setUser(JSON.parse(rawUser) as SessionUser);
          // Validación en background; si el token ya no sirve, el handler de 401 cierra sesión.
          authApi.verifyToken();
        }
      } catch (e) {
        console.warn('Error cargando sesión:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Registrar el handler global de 401 (lo dispara el cliente HTTP).
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await authApi.login(email, password);
      const sessionUser: SessionUser = {
        id: res.userId,
        email: res.email,
        nombre: res.nombre,
        rol: res.rol,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(sessionUser));
      setUser(sessionUser);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo iniciar sesión';
      setError(msg);
      throw e;
    }
  }, []);

  const persistUser = useCallback(async (su: SessionUser) => {
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(su));
    setUser(su);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    const returnUrl = Linking.createURL('auth/callback');
    const authUrl = `${API_HOST}/api/v1/oauth2/google/authorize?redirect_uri=${encodeURIComponent(returnUrl)}`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
    if (result.type !== 'success' || !result.url) {
      if (result.type === 'cancel' || result.type === 'dismiss') return;
      throw new Error('No se pudo completar el acceso con Google.');
    }
    const { queryParams } = Linking.parse(result.url);
    const token = queryParams?.token as string | undefined;
    const refreshToken = (queryParams?.refresh_token ?? queryParams?.refreshToken) as string | undefined;
    if (!token) throw new Error('El acceso con Google no devolvió un token.');
    await setSession(token, refreshToken ?? '');
    await persistUser({
      id: Number(queryParams?.userId ?? 0),
      email: String(queryParams?.email ?? ''),
      nombre: String(queryParams?.nombre ?? 'Usuario'),
      rol: (queryParams?.rol as UserRole) ?? 'EXTERNO',
    });
  }, [persistUser]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, error, login, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
