import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { APP_CONFIG } from '@/lib/config/app';
import { storage, errors, validation } from '@/lib/utils/helpers';
import { authApi } from '@/lib/api/auth';
import type { LoginRequest, RegisterRequest } from '@/lib/types/auth';
import { AuthContext, type AuthContextType } from './authContext';

// Tipos para las props del provider
interface AuthProviderProps {
  readonly children: ReactNode;
}

// Clave para localStorage
const AUTH_STORAGE_KEY = APP_CONFIG.STORAGE_KEYS.AUTH;

// Provider del contexto de autenticación
export function AuthProvider({ children }: AuthProviderProps) {
  // Carga optimista desde localStorage: si hay token + user, asumimos sesión válida
  // y renderizamos al instante. Después revalidamos contra el backend en background
  // y, si el token estaba inválido, hacemos logout. Esto evita un spinner
  // de pantalla completa antes de empezar a pintar el dashboard.
  const initialUser = (() => {
    try {
      const t = localStorage.getItem('token');
      const u = localStorage.getItem('user');
      if (t && u) return JSON.parse(u);
    } catch { /* fallthrough */ }
    return null;
  })();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [lastRegisteredEmail, setLastRegisteredEmail] = useState("");
  const [user, setUser] = useState<{
    id: number;
    email: string;
    nombre: string;
    rol: string;
  } | null>(initialUser);

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setUser(null);
          setIsAuthenticated(false);
          return;
        }

        try {
          const response = await authApi.verifyToken();

          if (response.success && response.data) {
            // Re-sincronizar con localStorage por si cambió.
            const userData = localStorage.getItem('user');
            if (userData) {
              try { setUser(JSON.parse(userData)); } catch { /* keep optimistic */ }
            }
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            storage.remove(AUTH_STORAGE_KEY);
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          storage.remove(AUTH_STORAGE_KEY);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        errors.log(err, 'AuthContext');
        setError('Error al cargar el estado de autenticación');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Escuchar evento de logout automático desde apiRequest
  useEffect(() => {
    const handleAutoLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      // Solo mostrar mensaje de sesión expirada si realmente había una sesión activa
      if (isAuthenticated) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
    };

    globalThis.addEventListener('auth:logout', handleAutoLogout);
    
    return () => {
      globalThis.removeEventListener('auth:logout', handleAutoLogout);
    };
  }, [isAuthenticated]);

  // Función de login con manejo de errores
  const login = useCallback(async (credentials?: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      setError(null); // Limpiar cualquier error previo
      
      // Validar credenciales
      if (credentials) {
        const { email, password } = credentials;
        if (validation.isEmpty(email) || validation.isEmpty(password)) {
          throw new Error('Email y contraseña son requeridos');
        }
        if (!validation.isValidEmail(email)) {
          throw new Error('Email inválido');
        }
        if (!validation.isValidPassword(password)) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
      }

      // Llamar a la API del backend
      if (credentials) {
        const loginRequest: LoginRequest = {
          email: credentials.email,
          password: credentials.password
        };
        
        const response = await authApi.login(loginRequest);
        
        if (response.success && response.data) {
          // Guardar tokens y datos del usuario
          const userData = {
            id: response.data.userId,
            email: response.data.email,
            nombre: response.data.nombre,
            rol: response.data.rol
          };

          localStorage.setItem('token', response.data.token);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(userData));

          // Guardar en el estado del contexto
          setUser(userData);
        } else {
          // Usar el mensaje de error del backend
          const errorMessage = response.error || response.message || 'Error en el login';
          throw new Error(errorMessage);
        }
      }
      
      const authData = { isAuthenticated: true, timestamp: Date.now() };
      storage.set(AUTH_STORAGE_KEY, authData);
      setIsAuthenticated(true);
    } catch (err) {
      const errorMessage = errors.getMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);


  // Función de registro con manejo de errores
  const register = useCallback(async (userData: { 
    nombre: string; 
    apellido: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
    aceptaTerminos: boolean;
    aceptaPolitica: boolean;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validar datos
      const { nombre, apellido, email, password, confirmPassword } = userData;
      
      if (validation.isEmpty(nombre) || validation.isEmpty(apellido)) {
        throw new Error('Nombre y apellido son requeridos');
      }
      
      if (validation.isEmpty(email) || validation.isEmpty(password)) {
        throw new Error('Email y contraseña son requeridos');
      }
      
      if (!validation.isValidEmail(email)) {
        throw new Error('Email inválido');
      }
      
      if (!validation.isValidPassword(password)) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      
      if (password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      // Validar aceptación de términos y política
      if (!userData.aceptaTerminos || !userData.aceptaPolitica) {
        throw new Error('Debes aceptar los términos y condiciones y la política de privacidad');
      }
      
      // Preparar datos para el backend
      const registerRequest: RegisterRequest = {
        nombre,
        apellido,
        email,
        password,
        confirmPassword,
        aceptaTerminos: userData.aceptaTerminos,
        aceptaPolitica: userData.aceptaPolitica
      };
      
      // Llamar a la API del backend
      const response = await authApi.register(registerRequest);
      
      if (response.success && response.data) {
        // Registro exitoso - mostrar mensaje de verificación de email
        setLastRegisteredEmail(email);
        setRegistrationSuccess(true);
        setError(null);
      } else {
        // Usar el mensaje de error del backend
        const errorMessage = response.error || response.message || 'Error en el registro';
        throw new Error(errorMessage);
      }
      
    } catch (err) {
      const errorMessage = errors.getMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función de logout con limpieza
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Intentar hacer logout en el backend
      try {
        await authApi.logout();
      } catch (error) {
        console.error('Error en logout del backend:', error);
        // Continuar con el logout local aunque falle el backend
      }
      
      // Limpiar datos locales
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      storage.remove(AUTH_STORAGE_KEY);
      
      // Limpiar estado del contexto
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      const errorMessage = errors.getMessage(err);
      setError(errorMessage);
      errors.log(err, 'AuthContext.logout');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Valor del contexto - memoizado para evitar re-renders innecesarios
  const contextValue: AuthContextType = useMemo(() => ({
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
    error,
    registrationSuccess,
    setRegistrationSuccess,
    lastRegisteredEmail
  }), [isAuthenticated, isLoading, user, login, register, logout, error, registrationSuccess, lastRegisteredEmail]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

