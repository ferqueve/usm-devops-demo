// Tipos para la API de autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  email: string;
  nombre: string;
  rol: string;
  expiresIn: number;
}

export interface RegisterResponse {
  message: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Función para hacer requests HTTP con auto-refresh
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Agregar token de autorización si existe
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    
    // Si es 401 y no es un retry, intentar refresh token
    if (response.status === 401 && !isRetry) {
      try {
        console.log('Token expirado, intentando renovar...');
        const refreshResponse = await authApi.refreshToken();
        
        if (refreshResponse.success && refreshResponse.data) {
          // Guardar nuevos tokens
          localStorage.setItem('token', refreshResponse.data.token);
          localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
          
          // Actualizar header de autorización con nuevo token
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${refreshResponse.data.token}`,
          };
          
          console.log('Token renovado exitosamente, reintentando petición...');
          // Reintentar la petición original con el nuevo token
          return apiRequest<T>(endpoint, { ...options, headers: config.headers }, true);
        }
      } catch (refreshError) {
        console.error('Error al renovar token:', refreshError);
        // Si falla el refresh, limpiar tokens y redirigir a login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Emitir evento personalizado para que el AuthContext se entere
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en la petición');
    }
    
    return data;
  } catch (error) {
    console.error('Error en API request:', error);
    throw error;
  }
}

// API de autenticación
export const authApi = {
  // Login
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Registro
  async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Logout
  async logout(): Promise<ApiResponse<string>> {
    return apiRequest<string>('/auth/logout', {
      method: 'POST',
    });
  },

  // Verificar token
  async verifyToken(): Promise<ApiResponse<boolean>> {
    return apiRequest<boolean>('/auth/verify', {
      method: 'GET',
    });
  },

  // Verificar email
  async verifyEmail(token: string): Promise<ApiResponse<string>> {
    return apiRequest<string>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Reenviar email de verificación
  async resendVerificationEmail(email: string): Promise<ApiResponse<string>> {
    return apiRequest<string>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Refresh token
  async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible');
    }

    return apiRequest<LoginResponse>('/auth/refresh', {
      method: 'POST',
      headers: {
        'Refresh-Token': refreshToken,
      },
    });
  },
};
