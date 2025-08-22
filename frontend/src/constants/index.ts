// Constantes de la aplicación

export const APP_NAME = 'UTEC Space Manager';
export const APP_VERSION = '1.0.0';

// Rutas de la API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const API_ENDPOINTS = {
  USERS: '/users',
  AUTH: '/auth',
  SPACES: '/spaces',
  BOOKINGS: '/bookings',
} as const;

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MANAGER: 'manager',
} as const;

// Estados de reserva
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
