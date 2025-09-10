import type { LucideIcon } from "lucide-react";

// Tipos para la navegación del sidebar
export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  isActive?: boolean;
}

// Tipos para el dashboard
export interface DashboardPageProps {
  onLogout?: () => void;
}

// Tipos para las reservas
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

// Tipos para los salones
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

// Tipos para las estadísticas
export interface Statistic {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
}

// Tipos para eventos del calendario
export interface CalendarEvent {
  id: string;
  title: string;
  room: string;
  start: Date;
  end: Date;
  color: string;
  type: 'reservation' | 'maintenance' | 'event';
}
