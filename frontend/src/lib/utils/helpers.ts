import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================================================
// Utilidades de UI
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// Utilidades para manejo de rutas
// ============================================================================

export const routeHelpers = {
  /**
   * Obtiene el nombre de la ruta desde el pathname
   */
  getRouteName: (pathname: string): string => {
    const path = pathname.replace('/', '');
    return path || 'dashboard';
  },

  /**
   * Capitaliza la primera letra de una cadena
   */
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Verifica si una ruta está activa
   */
  isActiveRoute: (currentPath: string, targetPath: string): boolean => {
    return currentPath === targetPath;
  },
};

// ============================================================================
// Utilidades para localStorage
// ============================================================================

export const storage = {
  /**
   * Guarda datos en localStorage
   */
  set: (key: string, value: unknown): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  },

  /**
   * Obtiene datos de localStorage
   */
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Error al obtener de localStorage:', error);
      return defaultValue || null;
    }
  },

  /**
   * Elimina datos de localStorage
   */
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
    }
  },

  /**
   * Limpia todo localStorage
   */
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  },
};

// ============================================================================
// Utilidades para validación
// ============================================================================

export const validation = {
  /**
   * Valida si un email es válido
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valida si una contraseña cumple los requisitos mínimos
   */
  isValidPassword: (password: string): boolean => {
    return password.length >= 6;
  },

  /**
   * Valida si un campo está vacío
   */
  isEmpty: (value: string): boolean => {
    return !value || value.trim().length === 0;
  },
};

// ============================================================================
// Utilidades para manejo de errores
// ============================================================================

export const errors = {
  /**
   * Obtiene un mensaje de error legible
   */
  getMessage: (error: unknown): string => {
    if (error instanceof Error) {
      // Si es un error de fetch o de red
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
      }
      // Si es un error de timeout
      if (error.message.includes('timeout')) {
        return 'La petición tardó demasiado tiempo. Intenta nuevamente.';
      }
      // Para otros errores, usar el mensaje tal como viene
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Ha ocurrido un error inesperado. Intenta nuevamente.';
  },

  /**
   * Logs de error con contexto
   */
  log: (error: unknown, context?: string): void => {
    const message = errors.getMessage(error);
    console.error(`[${context || 'App'}] Error:`, message, error);
  },
};


