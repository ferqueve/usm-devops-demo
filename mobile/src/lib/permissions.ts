/**
 * Gateo de navegación por rol, espejado del sidebar del web
 * (`frontend/src/components/layouts/DashboardLayout/DashboardSidebar.tsx`).
 * El orden replica el del sidebar web.
 */
import type { UserRole } from './types';

/** IDs de ítem de navegación = nombres de pantalla del drawer. */
export type NavItemId =
  | 'Dashboard'
  | 'Calendario'
  | 'Reservas'
  | 'Espacios'
  | 'Inventario'
  | 'Estadisticas'
  | 'Asistente'
  | 'Usuarios'
  | 'Sistema'
  | 'Auditoria';

export type NavItem = {
  id: NavItemId;
  label: string;
  /** Roles que ven el ítem. */
  roles: UserRole[];
};

const ALL: UserRole[] = ['ADMIN', 'ANALISTA', 'DOCENTE', 'ESTUDIANTE', 'EXTERNO', 'MANTENIMIENTO'];

export const NAV_ITEMS: NavItem[] = [
  { id: 'Dashboard', label: 'Inicio', roles: ALL },
  { id: 'Calendario', label: 'Calendario', roles: ALL },
  { id: 'Reservas', label: 'Reservas', roles: ['ADMIN', 'ANALISTA', 'DOCENTE', 'EXTERNO'] },
  { id: 'Espacios', label: 'Espacios', roles: ['ADMIN', 'ANALISTA', 'MANTENIMIENTO'] },
  { id: 'Inventario', label: 'Inventario', roles: ['ADMIN', 'ANALISTA', 'MANTENIMIENTO'] },
  { id: 'Estadisticas', label: 'Estadísticas', roles: ['ADMIN', 'ANALISTA', 'MANTENIMIENTO'] },
  { id: 'Asistente', label: 'Asistente IA', roles: ['ADMIN', 'ANALISTA'] },
  { id: 'Usuarios', label: 'Usuarios', roles: ['ADMIN'] },
  { id: 'Sistema', label: 'Sistema', roles: ['ADMIN'] },
  { id: 'Auditoria', label: 'Auditoría', roles: ['ADMIN'] },
];

export function navItemsForRole(rol: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(rol));
}

export function canAccess(rol: UserRole, id: NavItemId): boolean {
  const item = NAV_ITEMS.find((i) => i.id === id);
  return !!item && item.roles.includes(rol);
}
