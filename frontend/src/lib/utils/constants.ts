// Constantes de la aplicación
export const APP_CONFIG = {
  NAME: 'UTEC Space Manager',
  VERSION: '1.0.0',
  STORAGE_KEYS: {
    AUTH: 'utec-space-manager-auth',
    THEME: 'utec-space-manager-theme',
    PREFERENCES: 'utec-space-manager-preferences',
  },
  ROUTES: {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    CALENDAR: '/calendar',
    RESERVATIONS: '/reservations',
    ROOMS: '/rooms',
    STATISTICS: '/statistics',
    SETTINGS: '/settings',
  },
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    TIMEOUT: 10000,
  },
} as const;

// Utilidades para manejo de rutas
export const routeUtils = {
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

// Utilidades para localStorage
export const storageUtils = {
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

// Utilidades para validación
export const validationUtils = {
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

// Utilidades para manejo de errores
export const errorUtils = {
  /**
   * Obtiene un mensaje de error legible
   */
  getErrorMessage: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Ha ocurrido un error inesperado';
  },

  /**
   * Logs de error con contexto
   */
  logError: (error: unknown, context?: string): void => {
    const message = errorUtils.getErrorMessage(error);
    console.error(`[${context || 'App'}] Error:`, message, error);
  },
};
