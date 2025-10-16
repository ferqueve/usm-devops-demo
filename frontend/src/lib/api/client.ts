// ============================================================================
// Tipos para la API de autenticación
// ============================================================================

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

// ============================================================================
// Configuración de la API
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// ============================================================================
// Cliente HTTP Base
// ============================================================================

// Función para hacer requests HTTP con auto-refresh
export async function apiRequest<T>(
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
    
    // Si es 401/500 y no es un retry, intentar refresh token
    // PERO NO para endpoints de autenticación que no requieren token
    const isAuthEndpoint = endpoint.includes('/auth/login') || 
                          endpoint.includes('/auth/register') || 
                          endpoint.includes('/auth/verify-email') || 
                          endpoint.includes('/auth/resend-verification');
    
    // Verificar si el error podría ser por JWT expirado
    let isJwtError = false;
    
    // Si es 401, verificar si es por JWT expirado
    if (response.status === 401 && !isRetry && !isAuthEndpoint) {
      try {
        const errorData = await response.clone().json();
        const errorMessage = (errorData.error || errorData.message || '').toLowerCase();
        isJwtError = errorMessage.includes('jwt') || errorMessage.includes('token') || errorMessage.includes('expired');
      } catch (e) {
        // Si no se puede parsear pero es 401, probablemente sea JWT expirado
        isJwtError = true;
      }
    }
    
    // Si es 500, verificar si el error contiene "JWT" o "token"
    if (response.status === 500 && !isRetry && !isAuthEndpoint) {
      try {
        const errorData = await response.clone().json();
        const errorMessage = (errorData.error || errorData.message || '').toLowerCase();
        isJwtError = errorMessage.includes('jwt') || errorMessage.includes('token') || errorMessage.includes('expired');
      } catch (e) {
        // Si no se puede parsear, no es un error de JWT
        isJwtError = false;
      }
    }
    
    // Manejar 401 (Unauthorized) o 500 con error de JWT
    const shouldAttemptRefresh = isJwtError && !isRetry && !isAuthEndpoint;
    
    if (shouldAttemptRefresh) {
      // Solo intentar refresh si realmente hay un token (sesión válida)
      const hasValidToken = token && token.length > 0;
      
      if (hasValidToken) {
        try {
          const refreshResponse = await refreshToken();
          
          if (refreshResponse.success && refreshResponse.data) {
            // Guardar nuevos tokens
            localStorage.setItem('token', refreshResponse.data.token);
            localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
            
            // Actualizar header de autorización con nuevo token
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${refreshResponse.data.token}`,
            };
            
            // Reintentar la petición original con el nuevo token
            return apiRequest<T>(endpoint, { ...options, headers: config.headers }, true);
          }
        } catch (refreshError) {
          // Si falla el refresh, limpiar tokens y redirigir a login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          // Emitir evento personalizado para que el AuthContext se entere
          window.dispatchEvent(new CustomEvent('auth:logout'));
          
          throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        }
      }
    }
    
    // Si la respuesta no tiene contenido (204 No Content), devolver respuesta vacía exitosa
    if (response.status === 204) {
      return { success: true } as ApiResponse<T>;
    }
    
    // Verificar si la respuesta tiene contenido antes de parsear JSON
    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');
    
    let data: any = null;
    if (hasJsonContent) {
      data = await response.json();
    }
    
    if (!response.ok) {
      // Si el backend devuelve un error estructurado, usar ese mensaje
      const errorMessage = data?.error || data?.message || 'Error en la petición';
      throw new Error(errorMessage);
    }
    
    // El backend ya devuelve ApiResponse { success, data, message }
    // No necesitamos envolver de nuevo
    return data || { success: true } as ApiResponse<T>;
  } catch (error) {
    console.error('Error en API request:', error);
    throw error;
  }
}

// ============================================================================
// Helper para Actuator Requests
// ============================================================================

// Helper para hacer requests de Actuator con manejo de token refresh
export async function actuatorRequest(endpoint: string, isRetry: boolean = false): Promise<any> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  // Si es 401 y no es un retry, intentar refresh token
  if (response.status === 401 && !isRetry) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        // Intentar renovar el token con el header correcto
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Refresh-Token': refreshToken,
          },
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('token', data.token);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          
          // Reintentar la request original con el nuevo token
          return actuatorRequest(endpoint, true);
        }
      } catch (error) {
        console.error('Error al renovar token:', error);
      }
    }
    throw new Error('Token expirado. Por favor inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Función de Refresh Token
// ============================================================================

// Refresh token
export async function refreshToken(): Promise<ApiResponse<LoginResponse>> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No hay refresh token disponible');
  }

  // Llamar directamente a fetch para evitar el bucle infinito de refresh
  const url = `${API_BASE_URL}/auth/refresh`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Refresh-Token': refreshToken,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Error al refrescar token');
  }

  return data as ApiResponse<LoginResponse>;
}
