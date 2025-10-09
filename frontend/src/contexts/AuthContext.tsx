import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { APP_CONFIG } from '@/core/config/app';
import { storage, errors, validation } from '@/core/utils/helpers';
import { authApi } from '@/core/api/api';
import type { LoginRequest, RegisterRequest } from '@/core/api/api';

// Tipos para el contexto de autenticación
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    email: string;
    nombre: string;
    rol: string;
  } | null;
  login: (credentials?: { email: string; password: string }) => Promise<void>;
  register: (userData: { 
    nombre: string; 
    apellido: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  registrationSuccess: boolean;
  setRegistrationSuccess: (success: boolean) => void;
  lastRegisteredEmail: string;
}

// Tipos para las props del provider
interface AuthProviderProps {
  children: ReactNode;
}

// Crear contexto con valor por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clave para localStorage
const AUTH_STORAGE_KEY = APP_CONFIG.STORAGE_KEYS.AUTH;

// Provider del contexto de autenticación
export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [lastRegisteredEmail, setLastRegisteredEmail] = useState("");
  const [user, setUser] = useState<{
    email: string;
    nombre: string;
    rol: string;
  } | null>(null);

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Verificar si el token es válido con el backend
          try {
            const response = await authApi.verifyToken();
            
            if (response.success && response.data) {
                  // Cargar datos del usuario desde localStorage
                  const userData = localStorage.getItem('user');
                  if (userData) {
                    const parsedUserData = JSON.parse(userData);
                    setUser(parsedUserData);
                  }
              setIsAuthenticated(true);
            } else {
              // Token inválido, limpiar datos
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              storage.remove(AUTH_STORAGE_KEY);
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (error) {
            // Error al verificar token, limpiar datos
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            storage.remove(AUTH_STORAGE_KEY);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
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
      console.log('Auto-logout detectado, limpiando estado...');
      setUser(null);
      setIsAuthenticated(false);
      // Solo mostrar mensaje de sesión expirada si realmente había una sesión activa
      if (isAuthenticated) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
    };

    window.addEventListener('auth:logout', handleAutoLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleAutoLogout);
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

      // Preparar datos para el backend
      const registerRequest: RegisterRequest = {
        nombre,
        apellido,
        email,
        password,
        confirmPassword
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

  // Valor del contexto
  const contextValue: AuthContextType = {
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
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto de autenticación
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
}

