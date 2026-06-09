import {
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  Calendar,
  FileText,
  Home,
  Server,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import type { NavItemId } from '../lib/permissions';

/** Iconos lucide por ítem (los mismos que usa el sidebar del web). */
export const NAV_ICONS: Record<NavItemId, LucideIcon> = {
  Dashboard: Home,
  Calendario: Calendar,
  Reservas: BookOpen,
  Espacios: Building2,
  Inventario: Boxes,
  Estadisticas: BarChart3,
  Asistente: Sparkles,
  Usuarios: Users,
  Sistema: Server,
  Auditoria: FileText,
};
