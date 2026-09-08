import type { Permission } from '@/lib/config/permissions';
// ============================================================================
// Tipos para UI y componentes
// ============================================================================

import type { LucideIcon } from "lucide-react";

// Secciones en las que se agrupan los ítems del sidebar. El grupo "general"
// (Inicio, Calendario) se renderiza sin título: es la base de navegación y un
// label ahí solo agrega ruido.
export type SidebarSectionId =
  | 'general'
  | 'espacios'
  | 'academico'
  | 'analisis'
  | 'administracion';

export interface SidebarSection {
  id: SidebarSectionId;
  label: string | null;
}

/** Vista de una pantalla, colgada de su ítem en el sidebar. */
export interface SidebarSubItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Si esta, la sub-vista solo se lista para quien tenga ese permiso. */
  permiso?: Permission;
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  section: SidebarSectionId;
  /** Vistas de la pantalla: el ítem se vuelve colapsable. */
  children?: SidebarSubItem[];
  isActive?: boolean;
}

export interface Statistic {
  title?: string; // Hacer opcional para compatibilidad
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  label?: string; // Para compatibilidad con código existente
  trend?: string; // Para compatibilidad con código existente
}
