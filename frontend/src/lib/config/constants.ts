import { 
  Home,
  Calendar,
  BookOpen,
  Building2,
  BarChart3,
  Users,
  Server,
  FileText
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
    label: "Espacios",
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
  },
  {
    id: "audit",
    label: "Auditoría",
    icon: FileText,
    href: "/audit"
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
  EXTERNO: 'EXTERNO',
  MANTENIMIENTO: 'MANTENIMIENTO'
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
      '/rooms/:id',
      '/reservations',
      '/reservations/create',
      '/calendar',
      '/users',
      '/inventory',
      '/inventory/requests',
      '/statistics',
      '/system',
      '/audit'
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
      'system',
      'audit'
    ],
  },
  [ROLES.ANALISTA]: {
    name: 'Analista',
    description: 'Gestión de inventario y reservas',
    routes: [
      '/dashboard',
      '/rooms',
      '/rooms/:id',
      '/reservations',
      '/reservations/create',
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
    ],
  },
  [ROLES.DOCENTE]: {
    name: 'Docente',
    description: 'Acceso a reservas y eventos externos',
    routes: [
      '/dashboard',
      '/reservations',
      '/reservations/create',
      '/calendar'
    ],
    sidebarItems: [
      'dashboard',
      'reservations',
      'calendar'
    ],
  },
  [ROLES.ESTUDIANTE]: {
    name: 'Estudiante',
    description: 'Acceso limitado a visualización',
    routes: [
      '/dashboard',
      '/calendar'
    ],
    sidebarItems: [
      'dashboard',
      'calendar'
    ],
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
    ],
  },
  [ROLES.MANTENIMIENTO]: {
    name: 'Mantenimiento',
    description: 'Gestión completa de espacios e inventario',
    routes: [
      '/dashboard',
      '/rooms',
      '/rooms/:id',
      '/calendar',
      '/inventory',
      '/inventory/requests',
      '/statistics'
    ],
    sidebarItems: [
      'dashboard',
      'rooms',
      'calendar',
      'inventory',
      'statistics'
    ],
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

// Función auxiliar para convertir ruta con parámetros a regex
function convertRouteToPattern(route: string): string {
  const paramRegex = /:[^/]+/g;
  let pattern = route;
  let match: RegExpExecArray | null;
  
  while ((match = paramRegex.exec(route)) !== null) {
    pattern = pattern.replace(match[0], '[^/]+');
  }
  
  return pattern;
}

export const canAccessRoute = (userRole: string | null, route: string): boolean => {
  if (!userRole) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole as Role];
  if (!permissions) return false;
  
  // Verificar rutas exactas
  const routesArray = permissions.routes as readonly string[];
  if (routesArray.includes(route)) {
    return true;
  }
  
  // Verificar rutas con parámetros dinámicos
  for (const allowedRoute of permissions.routes) {
    if (allowedRoute.includes(':')) {
      // Convertir ruta con parámetros a regex
      const routePattern = convertRouteToPattern(allowedRoute);
      const regex = new RegExp(`^${routePattern}$`);
      if (regex.test(route)) {
        return true;
      }
    }
  }
  
  return false;
};

export const canAccessSidebarItem = (userRole: string | null, item: string): boolean => {
  if (!userRole) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole as Role];
  if (!permissions) return false;
  
  const sidebarItemsArray = permissions.sidebarItems as readonly string[];
  return sidebarItemsArray.includes(item);
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
  EXTERNO: ROLE_PERMISSIONS.EXTERNO.name,
  MANTENIMIENTO: 'Mantenimiento'
};

// Variantes de badges para roles (UI específico)
export const ROLE_BADGE_VARIANTS: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ADMIN: 'destructive',
  ANALISTA: 'default',
  DOCENTE: 'secondary',
  ESTUDIANTE: 'outline',
  EXTERNO: 'outline',
  MANTENIMIENTO: 'secondary'
};
