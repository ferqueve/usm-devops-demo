import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { APP_CONFIG, storageUtils, errorUtils, validationUtils } from '@/lib/utils/constants';
import { authApi } from '@/lib/api';
import type { LoginRequest, RegisterRequest } from '@/lib/api';

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
              storageUtils.remove(AUTH_STORAGE_KEY);
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (error) {
            // Error al verificar token, limpiar datos
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            storageUtils.remove(AUTH_STORAGE_KEY);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        errorUtils.logError(err, 'AuthContext');
        setError('Error al cargar el estado de autenticación');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Función de login con manejo de errores
  const login = useCallback(async (credentials?: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validar credenciales
      if (credentials) {
        const { email, password } = credentials;
        if (validationUtils.isEmpty(email) || validationUtils.isEmpty(password)) {
          throw new Error('Email y contraseña son requeridos');
        }
        if (!validationUtils.isValidEmail(email)) {
          throw new Error('Email inválido');
        }
        if (!validationUtils.isValidPassword(password)) {
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
          throw new Error(response.error || 'Error en el login');
        }
      }
      
      const authData = { isAuthenticated: true, timestamp: Date.now() };
      storageUtils.set(AUTH_STORAGE_KEY, authData);
      setIsAuthenticated(true);
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
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
      
      if (validationUtils.isEmpty(nombre) || validationUtils.isEmpty(apellido)) {
        throw new Error('Nombre y apellido son requeridos');
      }
      
      if (validationUtils.isEmpty(email) || validationUtils.isEmpty(password)) {
        throw new Error('Email y contraseña son requeridos');
      }
      
      if (!validationUtils.isValidEmail(email)) {
        throw new Error('Email inválido');
      }
      
      if (!validationUtils.isValidPassword(password)) {
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
        // Registro exitoso - mostrar mensaje de éxito
        console.log('Usuario registrado exitosamente:', response.data);
        // No hacer login automático, el usuario debe hacer login manualmente
      } else {
        throw new Error(response.error || 'Error en el registro');
      }
      
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
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
      storageUtils.remove(AUTH_STORAGE_KEY);
      
      // Limpiar estado del contexto
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      errorUtils.logError(err, 'AuthContext.logout');
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
    error
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
