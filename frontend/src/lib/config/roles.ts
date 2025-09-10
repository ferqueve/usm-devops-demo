// Configuración de roles y permisos del sistema
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
    name: 'Administrador',
    description: 'Acceso completo al sistema',
    routes: [
      '/dashboard',
      '/rooms',
      '/reservations', 
      '/calendar',
      '/users',
      '/inventory',
      '/statistics',
      '/settings'
    ],
    sidebarItems: [
      'dashboard',
      'rooms',
      'reservations',
      'calendar', 
      'users',
      'inventory',
      'statistics',
      'settings'
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
    name: 'Usuario Externo',
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
