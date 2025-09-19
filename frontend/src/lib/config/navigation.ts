import { 
  Home,
  Calendar,
  BookOpen,
  Building2,
  BarChart3,
  Settings
} from "lucide-react";
import type { SidebarMenuItem } from "@/lib/types/dashboard";

// Configuración de navegación del sidebar para UTEC Space Manager
export const sidebarMenuItems: SidebarMenuItem[] = [
  {
    id: "dashboard",
    label: "Inicio",
    icon: Home,
    href: "/dashboard",
    isActive: true
  },
  {
    id: "calendar",
    label: "Calendario",
    icon: Calendar,
    href: "/calendar"
  },
  {
    id: "reservations",
    label: "Reservas",
    icon: BookOpen,
    href: "/reservations"
  },
  {
    id: "rooms",
    label: "Salones",
    icon: Building2,
    href: "/rooms"
  },
  {
    id: "statistics",
    label: "Estadísticas",
    icon: BarChart3,
    href: "/statistics"
  },
  {
    id: "settings",
    label: "Configuración",
    icon: Settings,
    href: "/settings"
  }
];
