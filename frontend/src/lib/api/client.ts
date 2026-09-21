
import { API_BASE_URL } from '@/lib/config/api';

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
  userId: number;
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

// La URL vive en `lib/config/api`: la usan cinco módulos y los tests mockean
// este cliente entero.

// ============================================================================
// Dedupe de GET requests
// ----------------------------------------------------------------------------
// Colapsa requests idénticos hechos en una ventana corta:
//   - StrictMode dispara cada effect dos veces en dev
//   - Componentes hermanos consultan los mismos catálogos en paralelo
//   - Re-renders rápidos vuelven a llamar el mismo endpoint
// El TTL es deliberadamente corto (1s) para no servir datos viejos: solo
// cubre el burst de montaje y los duplicados sincrónicos.
// ============================================================================

const DEDUPE_TTL_MS = 1000;
const inflightGets = new Map<string, Promise<unknown>>();
const recentGets = new Map<string, { ts: number; value: unknown }>();
// Sube con cada escritura. Un GET que salió antes no se guarda ni se comparte
// después: traería los datos de antes de la escritura.
let generacion = 0;

function dedupeKey(url: string, method: string, body: BodyInit | null | undefined): string {
  return `${method.toUpperCase()} ${url} ${typeof body === 'string' ? body : ''}`;
}

function isGetMethod(method: string | undefined): boolean {
  return !method || method.toUpperCase() === 'GET';
}

async function withDedupe<T>(key: string, exec: () => Promise<T>): Promise<T> {
  const cached = recentGets.get(key);
  if (cached && Date.now() - cached.ts < DEDUPE_TTL_MS) {
    return cached.value as T;
  }
  const inflight = inflightGets.get(key);
  if (inflight) return inflight as Promise<T>;

  const nacida = generacion;
  const promise = (async () => {
    try {
      const value = await exec();
      if (nacida === generacion) recentGets.set(key, { ts: Date.now(), value });
      return value;
    } finally {
      // Si hubo una escritura, el mapa ya se vació y la entrada es de otro.
      if (nacida === generacion) inflightGets.delete(key);
    }
  })();
  inflightGets.set(key, promise as Promise<unknown>);
  return promise;
}

// ============================================================================
// Cliente HTTP Base
// ============================================================================

// Funciones auxiliares para reducir complejidad
function isAuthEndpoint(endpoint: string): boolean {
  return endpoint.includes('/auth/login') || 
         endpoint.includes('/auth/register') || 
         endpoint.includes('/auth/verify-email') || 
         endpoint.includes('/auth/resend-verification');
}

/**
 * Si la respuesta significa "tu sesion no sirve para esto": hay que refrescar
 * el token y, si eso falla, cerrar sesion.
 *
 * Un 401 siempre cuenta, sin mirar el texto. Antes se exigia que el mensaje
 * dijera "jwt", "token" o "expired", asi que la sesion caducada se detectaba
 * solo porque el backend responde "Token JWT invalido" en castellano y esas
 * palabras aparecen dentro. Un 401 con cualquier otra redaccion -- el de un
 * proxy, el que devuelve Spring por defecto -- dejaba al usuario en una
 * pantalla vacia, sin sesion y sin que nadie lo mandara al login.
 *
 * En el 500 el texto sigue importando: ahi solo es cosa del token si lo dice.
 */
async function checkJwtError(response: Response, status: number): Promise<boolean> {
  if (status === 401) return true;
  if (status !== 500) return false;

  try {
    const errorData = await response.clone().json();
    const errorMessage = (errorData.error || errorData.message || '').toLowerCase();
    return errorMessage.includes('jwt') || errorMessage.includes('token') || errorMessage.includes('expired');
  } catch {
    return false;
  }
}

async function attemptTokenRefresh<T>(
  endpoint: string,
  options: RequestInit,
  config: RequestInit
): Promise<ApiResponse<T>> {
  const refreshResponse = await refreshToken();
  
  if (refreshResponse.success && refreshResponse.data) {
    localStorage.setItem('token', refreshResponse.data.token);
    localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
    
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${refreshResponse.data.token}`,
    };
    
    return apiRequest<T>(endpoint, { ...options, headers: config.headers }, true);
  }
  
  throw new Error('Error al refrescar token');
}

function handleRefreshFailure(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  globalThis.dispatchEvent(new CustomEvent('auth:logout'));
}

function createRequestConfig(options: RequestInit): RequestInit {
  const token = localStorage.getItem('token');
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  return config;
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  if (response.status === 204) {
    return { success: true } as ApiResponse<T>;
  }
  
  const contentType = response.headers.get('content-type');
  const hasJsonContent = contentType?.includes('application/json');
  
  if (hasJsonContent) {
    return await response.json() as ApiResponse<T>;
  }
  
  return null;
}

// Función para hacer requests HTTP con auto-refresh
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = createRequestConfig(options);
  const token = localStorage.getItem('token');

  if (!isRetry && isGetMethod(options.method)) {
    return withDedupe<ApiResponse<T>>(
      dedupeKey(url, options.method || 'GET', options.body as BodyInit | null | undefined),
      () => executeApiRequest<T>(endpoint, options, url, config, token, isRetry),
    );
  }

  // Una escritura deja viejo lo leído en el último segundo y lo que está en
  // vuelo: sin esto, el refresh que sigue a un alta devolvía la lista de antes.
  // Se limpia también al terminar, por los GET que salieron mientras tanto.
  clearApiCache();
  try {
    return await executeApiRequest<T>(endpoint, options, url, config, token, isRetry);
  } finally {
    clearApiCache();
  }
}

async function executeApiRequest<T>(
  endpoint: string,
  options: RequestInit,
  url: string,
  config: RequestInit,
  token: string | null,
  isRetry: boolean,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, config);
    const authEndpoint = isAuthEndpoint(endpoint);
    const isJwtError = await checkJwtError(response, response.status);
    const shouldAttemptRefresh = isJwtError && !isRetry && !authEndpoint;
    
    if (shouldAttemptRefresh && token && token.length > 0) {
      try {
        // Intentar refrescar el token y reintentar la petición
        const refreshedResponse = await attemptTokenRefresh<T>(endpoint, options, config);
        // Si el refresh fue exitoso, retornar la respuesta sin mostrar el error 401
        return refreshedResponse;
      } catch {
        // Solo manejar el error si el refresh falló
        handleRefreshFailure();
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
    }
    
    const data = await parseResponse<T>(response);
    
    if (!response.ok) {
      const errorMessage = data?.error || data?.message || 'Error en la petición';
      throw new Error(errorMessage);
    }
    
    return data || { success: true } as ApiResponse<T>;
  } catch (error) {
    // Solo loggear errores que no sean de refresh exitoso
    if (!(error instanceof Error && error.message.includes('Tu sesión ha expirado'))) {
      console.error('Error en API request:', error);
    }
    throw error;
  }
}

// ============================================================================
// Helper para Actuator Requests
// ============================================================================

async function attemptActuatorTokenRefresh(endpoint: string): Promise<unknown> {
  const refreshTokenValue = localStorage.getItem('refreshToken');
  if (!refreshTokenValue) {
    throw new Error('Token expirado. Por favor inicia sesión nuevamente.');
  }

  try {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Refresh-Token': refreshTokenValue,
      },
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return actuatorRequest(endpoint, true);
    }
  } catch (error) {
    console.error('Error al renovar token:', error);
  }
  
  throw new Error('Token expirado. Por favor inicia sesión nuevamente.');
}

async function parseActuatorResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    return await response.json();
  }
  
  if (contentType?.includes('text/plain')) {
    return await response.text();
  }
  
  // Intentar JSON por defecto, pero manejar errores
  try {
    return await response.json();
  } catch {
    return await response.text();
  }
}

// Helper para obtener mensaje de error en español según el código de estado
function getStatusTextInSpanish(status: number): string {
  const statusMessages: Record<number, string> = {
    400: 'Solicitud inválida',
    401: 'No autorizado',
    403: 'Acceso denegado',
    404: 'Recurso no encontrado',
    500: 'Error interno del servidor',
    502: 'Error de puerta de enlace',
    503: 'Servicio no disponible',
  };
  return statusMessages[status] || `Error ${status}`;
}

// Helper para hacer requests de Actuator con manejo de token refresh.
// El tipo es una aserción sobre la respuesta del actuator, igual que en apiRequest<T>:
// no hay validación en runtime.
export async function actuatorRequest<T = unknown>(endpoint: string, isRetry: boolean = false): Promise<T> {
  const url = `${API_BASE_URL.replace('/api/v1', '')}${endpoint}`;
  if (isRetry) return executeActuatorRequest(endpoint, url, true) as Promise<T>;
  return withDedupe<T>(dedupeKey(url, 'GET', null), () => executeActuatorRequest(endpoint, url, false) as Promise<T>);
}

async function executeActuatorRequest(endpoint: string, url: string, isRetry: boolean): Promise<unknown> {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (response.status === 401 && !isRetry) {
    return attemptActuatorTokenRefresh(endpoint);
  }

  // /actuator/health responde 503 cuando algún componente está DOWN, pero el cuerpo
  // es la respuesta buena: dice qué componente cayó. Tratarlo como error dejaba la
  // pantalla de Sistema en "UNKNOWN" justo cuando más importa saber qué pasa.
  const esHealthDegradado = response.status === 503 && endpoint.startsWith('/actuator/health');

  if (!response.ok && !esHealthDegradado) {
    throw new Error(`Error ${response.status}: ${getStatusTextInSpanish(response.status)}`);
  }

  return parseActuatorResponse(response);
}

// Invalida toda la cache de dedupe. Llamar después de una mutación que cambie
// datos que algún componente pueda haber leído recientemente.
export function clearApiCache(): void {
  generacion++;
  recentGets.clear();
  inflightGets.clear();
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
