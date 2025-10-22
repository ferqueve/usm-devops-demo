import { 
  Users, 
  BookOpen,
  Building2,
  BarChart3,
  AlertCircle
} from "lucide-react";
import type { 
  Statistic, 
  Reservation, 
  Room, 
  CalendarEvent 
} from "@/lib/types";

// Datos mock para el Dashboard Principal
export const dashboardStats: Statistic[] = [
  {
    label: "Reservas Activas",
    value: 24,
    change: "+12% desde ayer",
    trend: "up",
    icon: BookOpen
  },
  {
    label: "Espacios Disponibles",
    value: 8,
    change: "3 en mantenimiento",
    trend: "neutral",
    icon: Building2
  },
  {
    label: "Ocupación Promedio",
    value: "78%",
    change: "+5% esta semana",
    trend: "up",
    icon: BarChart3
  },
  {
    label: "Usuarios Activos",
    value: 156,
    change: "+8 nuevos hoy",
    trend: "up",
    icon: Users
  }
];

// Datos mock para reservas
export const mockReservations: Reservation[] = [
  {
    id: "1",
    roomName: "Aula 101",
    userName: "Dr. María García",
    date: "2024-01-15",
    startTime: "09:00",
    endTime: "11:00",
    purpose: "Clase de Programación Avanzada",
    status: "confirmed",
    attendees: 25
  },
  {
    id: "2",
    roomName: "Laboratorio 2A",
    userName: "Ing. Carlos López",
    date: "2024-01-15",
    startTime: "14:00",
    endTime: "16:00",
    purpose: "Práctica de Redes",
    status: "confirmed",
    attendees: 18
  },
  {
    id: "3",
    roomName: "Auditorio Principal",
    userName: "Prof. Ana Rodríguez",
    date: "2024-01-16",
    startTime: "10:00",
    endTime: "12:00",
    purpose: "Presentación de Proyectos",
    status: "pending",
    attendees: 45
  },
  {
    id: "4",
    roomName: "Sala de Reuniones 3",
    userName: "Lic. Luis Pérez",
    date: "2024-01-15",
    startTime: "16:00",
    endTime: "17:00",
    purpose: "Reunión de Coordinación",
    status: "cancelled",
    attendees: 8
  }
];

// Datos mock para espacios
export const mockRooms: Room[] = [
  {
    id: "1",
    name: "Aula 101",
    capacity: 30,
    type: "classroom",
    equipment: ["Proyector", "Pizarra", "WiFi"],
    isAvailable: true,
    floor: 1,
    building: "Edificio A"
  },
  {
    id: "2",
    name: "Laboratorio 2A",
    capacity: 20,
    type: "laboratory",
    equipment: ["Computadoras", "Proyector", "Red", "Software Especializado"],
    isAvailable: true,
    floor: 2,
    building: "Edificio B"
  },
  {
    id: "3",
    name: "Auditorio Principal",
    capacity: 150,
    type: "auditorium",
    equipment: ["Sistema de Sonido", "Proyector 4K", "Escenario", "Grabación"],
    isAvailable: false,
    floor: 1,
    building: "Edificio Central"
  },
  {
    id: "4",
    name: "Sala de Reuniones 3",
    capacity: 12,
    type: "meeting-room",
    equipment: ["TV", "Pizarra", "Café"],
    isAvailable: true,
    floor: 3,
    building: "Edificio A"
  },
  {
    id: "5",
    name: "Aula 205",
    capacity: 25,
    type: "classroom",
    equipment: ["Proyector", "Pizarra"],
    isAvailable: true,
    floor: 2,
    building: "Edificio A"
  },
  {
    id: "6",
    name: "Laboratorio 1B",
    capacity: 15,
    type: "laboratory",
    equipment: ["Equipos de Medición", "Computadoras"],
    isAvailable: false,
    floor: 1,
    building: "Edificio B"
  }
];

// Datos mock para eventos del calendario
export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Clase Programación",
    room: "Aula 101",
    start: "2024-01-15T09:00:00",
    end: "2024-01-15T11:00:00",
    color: "#3b82f6",
    type: "reservation"
  },
  {
    id: "2",
    title: "Práctica Redes",
    room: "Laboratorio 2A",
    start: "2024-01-15T14:00:00",
    end: "2024-01-15T16:00:00",
    color: "#10b981",
    type: "reservation"
  },
  {
    id: "3",
    title: "Mantenimiento",
    room: "Auditorio Principal",
    start: "2024-01-16T08:00:00",
    end: "2024-01-16T12:00:00",
    color: "#f59e0b",
    type: "maintenance"
  },
  {
    id: "4",
    title: "Presentación Proyectos",
    room: "Auditorio Principal",
    start: "2024-01-17T10:00:00",
    end: "2024-01-17T12:00:00",
    color: "#8b5cf6",
    type: "event"
  }
];

// Datos mock para estadísticas
export const mockStatistics: Statistic[] = [
  {
    label: "Reservas del Mes",
    value: 342,
    change: "+15% vs mes anterior",
    trend: "up",
    icon: BookOpen
  },
  {
    label: "Ocupación Promedio",
    value: "82%",
    change: "+8% vs mes anterior",
    trend: "up",
    icon: BarChart3
  },
  {
    label: "Espacios en Mantenimiento",
    value: 2,
    change: "-1 vs mes anterior",
    trend: "down",
    icon: AlertCircle
  },
  {
    label: "Usuarios Activos",
    value: 89,
    change: "+12 vs mes anterior",
    trend: "up",
    icon: Users
  }
];

