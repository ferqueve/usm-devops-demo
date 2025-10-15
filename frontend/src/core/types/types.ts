import type { LucideIcon } from "lucide-react";

// ============================================================================
// Tipos para Usuarios
// ============================================================================

export type UserRole = 'ADMIN' | 'ANALISTA' | 'DOCENTE' | 'ESTUDIANTE' | 'EXTERNO';

export interface User {
  id: number;
  email: string;
  nombre: string;
  rolApp: UserRole;
  verificado: boolean;
  activo: boolean;
  oauthProv?: string;
  createdAt: string;
}

export interface PagedUsers {
  content: User[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface UserFilters {
  search?: string;
  rol?: UserRole;
  verificado?: boolean;
  activo?: boolean;
}

export interface ChangeRoleRequest {
  rolApp: UserRole;
}

// ============================================================================
// Tipos para Dashboard y Navegación
// ============================================================================

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  isActive?: boolean;
}

export interface DashboardPageProps {
  onLogout?: () => void;
}

// ============================================================================
// Tipos para Reservas
// ============================================================================

export interface Reservation {
  id: string;
  roomName: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  attendees: number;
}

// ============================================================================
// Tipos para Salones
// ============================================================================

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: 'classroom' | 'laboratory' | 'auditorium' | 'meeting-room';
  equipment: string[];
  isAvailable: boolean;
  floor: number;
  building: string;
}

// ============================================================================
// Tipos para Estadísticas
// ============================================================================

export interface Statistic {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
}

// ============================================================================
// Tipos para Eventos del Calendario
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  room: string;
  start: Date;
  end: Date;
  color: string;
  type: 'reservation' | 'maintenance' | 'event';
}

// ============================================================================
// Tipos para Tracking de Usuarios Activos
// ============================================================================

export interface ActiveUser {
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
}

export interface ActiveUsersStats {
  totalActiveUsers: number;
  activeUsers: ActiveUser[];
}


