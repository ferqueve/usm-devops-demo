// Configuración general de la aplicación

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
    USERS: '/users',
  },
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    TIMEOUT: 10000,
  },
} as const;


