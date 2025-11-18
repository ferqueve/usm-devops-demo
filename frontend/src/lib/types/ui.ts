// ============================================================================
// Tipos para UI y componentes
// ============================================================================

import type { LucideIcon } from "lucide-react";

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
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
