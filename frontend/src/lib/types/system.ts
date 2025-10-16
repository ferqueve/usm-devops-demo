// ============================================================================
// Tipos para sistema y estadísticas
// ============================================================================

export interface ActiveUser {
  email: string;
  nombre: string;
  apellido?: string; // Para compatibilidad con código existente
  rol: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
}

export interface ActiveUsersStats {
  totalActiveUsers: number;
  activeUsers: ActiveUser[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  resource?: {
    id: string;
    title: string;
  };
  color?: string; // Para compatibilidad con código existente
  room?: string; // Para compatibilidad con código existente
  type?: string; // Para compatibilidad con código existente
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  location?: string; // Hacer opcional para compatibilidad
  equipment: string[];
  status?: 'available' | 'occupied' | 'maintenance'; // Hacer opcional para compatibilidad
  description?: string;
  type?: string; // Para compatibilidad con código existente
  isAvailable?: boolean; // Para compatibilidad con código existente
  floor?: number; // Para compatibilidad con código existente
  building?: string; // Para compatibilidad con código existente
}

export interface Reservation {
  id: string;
  roomId?: string; // Hacer opcional para compatibilidad
  userId?: string; // Hacer opcional para compatibilidad
  startTime?: string; // Hacer opcional para compatibilidad
  endTime?: string; // Hacer opcional para compatibilidad
  purpose?: string; // Hacer opcional para compatibilidad
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: string; // Hacer opcional para compatibilidad
  updatedAt?: string; // Hacer opcional para compatibilidad
  roomName?: string; // Para compatibilidad con código existente
  userName?: string; // Para compatibilidad con código existente
  date?: string; // Para compatibilidad con código existente
  attendees?: number; // Para compatibilidad con código existente
}
