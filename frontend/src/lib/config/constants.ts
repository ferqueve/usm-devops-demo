import { 
  Home,
  Calendar,
  BookOpen,
  Building2,
  BarChart3,
  Users,
  Server
} from "lucide-react";
import type { SidebarMenuItem } from '../types/ui';
import type { UserRole } from '../types/users';

// ============================================================================
// Configuración de Navegación
// ============================================================================

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
    id: "users",
    label: "Usuarios",
    icon: Users,
    href: "/users"
  },
  {
    id: "system",
    label: "Sistema",
    icon: Server,
    href: "/system"
  }
];

// ============================================================================
// Configuración de Roles y Permisos
// ============================================================================

export const ROLES = {
  ADMIN: 'ADMIN',
  ANALISTA: 'ANALISTA', 
  DOCENTE: 'DOCENTE',
  ESTUDIANTE: 'ESTUDIANTE',
  EXTERNO: 'EXTERNO'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Configuración de rutas y permisos por rol
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    name: 'Admin',
    description: 'Acceso completo al sistema',
    routes: [
      '/dashboard',
      '/rooms',
      '/reservations', 
      '/calendar',
      '/users',
      '/inventory',
      '/statistics',
      '/system'
    ],
    sidebarItems: [
      'dashboard',
      'rooms',
      'reservations',
      'calendar', 
      'users',
      'inventory',
      'statistics',
      'Users',
      'system'
    ]
  },
  [ROLES.ANALISTA]: {
    name: 'Analista',
    description: 'Gestión de inventario y reservas',
    routes: [
      '/dashboard',
      '/rooms',
      '/reservations',
      '/calendar',
      '/inventory',
      '/statistics'
    ],
    sidebarItems: [
      'dashboard',
      'rooms',
      'reservations',
      'calendar',
      'inventory',
      'statistics'
    ]
  },
  [ROLES.DOCENTE]: {
    name: 'Docente',
    description: 'Acceso a reservas y eventos externos',
    routes: [
      '/dashboard',
      '/rooms',
      '/reservations',
      '/calendar'
    ],
    sidebarItems: [
      'dashboard',
      'rooms',
      'reservations',
      'calendar'
    ]
  },
  [ROLES.ESTUDIANTE]: {
    name: 'Estudiante',
    description: 'Acceso limitado a visualización',
    routes: [
      '/dashboard',
      '/rooms',
      '/calendar'
    ],
    sidebarItems: [
      'dashboard',
      'rooms',
      'calendar'
    ]
  },
  [ROLES.EXTERNO]: {
    name: 'Externo',
    description: 'Acceso a eventos externos únicamente',
    routes: [
      '/dashboard',
      '/calendar'
    ],
    sidebarItems: [
      'dashboard',
      'calendar'
    ]
  }
} as const;

// Funciones de utilidad para verificar roles
export const hasRole = (userRole: string | null, requiredRole: Role): boolean => {
  if (!userRole) return false;
  return userRole === requiredRole;
};

export const hasAnyRole = (userRole: string | null, roles: Role[]): boolean => {
  if (!userRole) return false;
  return roles.includes(userRole as Role);
};

export const canAccessRoute = (userRole: string | null, route: string): boolean => {
  if (!userRole) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole as Role];
  if (!permissions) return false;
  
  return permissions.routes.includes(route as any);
};

export const canAccessSidebarItem = (userRole: string | null, item: string): boolean => {
  if (!userRole) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole as Role];
  if (!permissions) return false;
  
  return permissions.sidebarItems.includes(item as any);
};

export const getUserPermissions = (userRole: string | null) => {
  if (!userRole) return null;
  return ROLE_PERMISSIONS[userRole as Role] || null;
};

// ============================================================================
// Configuración de Usuarios
// ============================================================================

// Re-exportar roles como array
export const USER_ROLES = Object.values(ROLES) as readonly UserRole[];

// Helper para obtener label de rol (usa ROLE_PERMISSIONS existente)
export const getRoleLabel = (role: UserRole): string => {
  return ROLE_PERMISSIONS[role]?.name || role;
};

// Labels de roles en español (para uso directo)
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: ROLE_PERMISSIONS.ADMIN.name,
  ANALISTA: ROLE_PERMISSIONS.ANALISTA.name,
  DOCENTE: ROLE_PERMISSIONS.DOCENTE.name,
  ESTUDIANTE: ROLE_PERMISSIONS.ESTUDIANTE.name,
  EXTERNO: ROLE_PERMISSIONS.EXTERNO.name
};

// Variantes de badges para roles (UI específico)
export const ROLE_BADGE_VARIANTS: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ADMIN: 'destructive',
  ANALISTA: 'default',
  DOCENTE: 'secondary',
  ESTUDIANTE: 'outline',
  EXTERNO: 'outline'
};
