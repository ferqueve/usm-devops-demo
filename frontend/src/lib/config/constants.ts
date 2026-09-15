import {
  Home,
  Calendar,
  BookOpen,
  Building2,
  BarChart3,
  Users,
  Server,
  FileText,
  Sparkles,
  GraduationCap,
  Megaphone,
  Leaf,
  Network,
  LayoutList,
  CalendarClock,
  Boxes,
  Activity,
  AlertTriangle,
  Database,
  ClipboardList,
  SlidersHorizontal,
  BrainCircuit,
} from "lucide-react";
import type { SidebarMenuItem, SidebarSection } from '../types/ui';
import type { UserRole } from '../types/users';

// ============================================================================
// Configuración de Navegación
// ============================================================================

// Orden de las secciones en el sidebar. Este array manda: agregar una pantalla
// es sumarle `section` a su ítem, no tocar el layout. La sección "general" no
// lleva título; el resto se rotula.
export const sidebarSections: SidebarSection[] = [
  { id: "general", label: null },
  { id: "espacios", label: "Espacios" },
  { id: "academico", label: "Académico" },
  { id: "analisis", label: "Análisis" },
  { id: "administracion", label: "Administración" }
];

export const sidebarMenuItems: SidebarMenuItem[] = [
  {
    id: "dashboard",
    label: "Inicio",
    icon: Home,
    href: "/dashboard",
    section: "general",
    isActive: true
  },
  {
    id: "calendar",
    label: "Calendario",
    icon: Calendar,
    href: "/calendar",
    section: "general"
  },
  {
    id: "reservations",
    label: "Reservas",
    icon: BookOpen,
    href: "/reservations",
    section: "espacios"
  },
  {
    id: "rooms",
    label: "Espacios",
    icon: Building2,
    href: "/rooms",
    section: "espacios"
  },
  {
    id: "inventory",
    label: "Inventario",
    icon: Boxes,
    href: "/inventory",
    section: "espacios"
  },
  {
    id: "inventory-requests",
    label: "Solicitudes",
    icon: ClipboardList,
    href: "/inventory/requests",
    section: "espacios"
  },
  {
    id: "materias",
    label: "Materias",
    icon: GraduationCap,
    href: "/materias",
    section: "academico",
    // Las tres vistas de Materias viven en el sidebar y no en un segmented
    // adentro de la pantalla: son destinos, y como tales se navegan por URL.
    children: [
      { id: "materias-plan", label: "Plan", icon: Network, href: "/materias?tab=mapa" },
      { id: "materias-catalogo", label: "Catálogo", icon: LayoutList, href: "/materias?tab=listado" },
      { id: "materias-tutorias", label: "Tutorías", icon: CalendarClock, href: "/materias?tab=tutorias" }
    ]
  },
  // Tutorías no tiene ítem propio: cuelga de una materia, así que vive como pestaña
  // dentro de Materias (/materias?tab=tutorias). Eventos sí queda aparte: es la
  // superficie del rol EXTERNO y no depende de ninguna materia.
  {
    id: "eventos",
    label: "Eventos",
    icon: Megaphone,
    href: "/eventos",
    section: "academico"
  },
  {
    id: "statistics",
    label: "Estadísticas",
    icon: BarChart3,
    href: "/statistics",
    section: "analisis",
    children: [
      // Cada vista pide el permiso de sus propios endpoints: MANTENIMIENTO no
      // ve las de reservas y ANALISTA veia la de inventario sin poder abrirla.
      { id: "statistics-reservas", label: "Reservas", icon: BarChart3, href: "/statistics?tab=reservas", permiso: "estadisticas:ver_reservas" },
      { id: "statistics-inventario", label: "Inventario", icon: Boxes, href: "/statistics?tab=inventario", permiso: "estadisticas:ver_inventario" },
      // Tutorías y eventos: usa los endpoints de reservas, así que pide su permiso.
      { id: "statistics-academico", label: "Académico", icon: GraduationCap, href: "/statistics?tab=academico", permiso: "estadisticas:ver_reservas" }
    ]
  },
  {
    id: "predicciones",
    label: "Predicciones",
    icon: BrainCircuit,
    href: "/predicciones",
    section: "analisis",
    children: [
      // Las tres leen los endpoints de ML, que piden el permiso de ver reservas.
      { id: "predicciones-reservas", label: "Reservas", icon: BarChart3, href: "/predicciones?tab=reservas", permiso: "estadisticas:ver_reservas" },
      { id: "predicciones-inventario", label: "Inventario", icon: Boxes, href: "/predicciones?tab=inventario", permiso: "estadisticas:ver_reservas" },
      { id: "predicciones-academico", label: "Académico", icon: GraduationCap, href: "/predicciones?tab=academico", permiso: "estadisticas:ver_reservas" }
    ]
  },
  {
    id: "asistente",
    label: "Asistente IA",
    icon: Sparkles,
    href: "/asistente",
    section: "analisis"
  },
  {
    id: "sostenibilidad",
    label: "Sostenibilidad",
    icon: Leaf,
    href: "/sostenibilidad",
    section: "analisis"
  },
  {
    id: "users",
    label: "Usuarios",
    icon: Users,
    href: "/users",
    section: "administracion"
  },
  {
    id: "audit",
    label: "Auditoría",
    icon: FileText,
    href: "/audit",
    section: "administracion"
  },
  {
    id: "system",
    label: "Sistema",
    icon: Server,
    href: "/system",
    section: "administracion",
    children: [
      { id: "system-resumen", label: "Resumen", icon: BarChart3, href: "/system?tab=resumen" },
      { id: "system-rendimiento", label: "Rendimiento", icon: Activity, href: "/system?tab=rendimiento" },
      { id: "system-errores", label: "Errores", icon: AlertTriangle, href: "/system?tab=errores" },
      { id: "system-datos", label: "Base de datos", icon: Database, href: "/system?tab=datos" }
    ]
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: SlidersHorizontal,
    href: "/configuracion",
    section: "administracion"
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
      '/predicciones',
      '/asistente',
      '/system',
      '/audit',
      '/materias',
      '/materias/:id',
      '/tutorias',
      '/tutorias/:id',
      '/eventos',
      '/eventos/:id',
      '/sostenibilidad',
      '/configuracion'
    ],
    sidebarItems: [
      'dashboard',
      'rooms',
      'reservations',
      'calendar',
      'users',
      'inventory',
      'inventory-requests',
      'statistics',
      'predicciones',
      'asistente',
      'system',
      'audit',
      'configuracion',
      'materias',
      'eventos',
      'sostenibilidad'
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
      '/statistics',
      '/predicciones',
      '/asistente',
      '/materias',
      '/materias/:id',
      '/eventos',
      '/eventos/:id',
      '/configuracion'
    ],
    sidebarItems: [
      'dashboard',
      'rooms',
      'reservations',
      'calendar',
      'inventory',
      'statistics',
      'predicciones',
      'asistente',
      'materias',
      'eventos',
      'configuracion'
    ],
  },
  [ROLES.DOCENTE]: {
    name: 'Docente',
    description: 'Gestiona sus materias, recursos y tutorías',
    routes: [
      '/dashboard',
      '/reservations',
      '/reservations/create',
      '/calendar',
      '/materias',
      '/materias/:id',
      '/tutorias',
      '/tutorias/:id',
      '/eventos',
      '/eventos/:id'
    ],
    sidebarItems: [
      'dashboard',
      'reservations',
      'calendar',
      'materias',
      'eventos'
    ],
  },
  [ROLES.ESTUDIANTE]: {
    name: 'Estudiante',
    description: 'Materias, recursos, tutorías y eventos',
    routes: [
      '/dashboard',
      // Consulta los espacios del campus, no los administra: el backend le da
      // espacio:ver y su dashboard enlaza ahi ("espacios libres").
      '/rooms',
      '/rooms/:id',
      '/calendar',
      '/materias',
      '/materias/:id',
      '/tutorias',
      '/tutorias/:id',
      '/eventos',
      '/eventos/:id'
    ],
    sidebarItems: [
      'dashboard',
      'rooms',
      'calendar',
      'materias',
      'eventos'
    ],
  },
  [ROLES.EXTERNO]: {
    name: 'Externo',
    description: 'Oferta abierta de eventos y cursos',
    routes: [
      '/dashboard',
      // Pide y cancela sus propias reservas: el backend le da reserva:crear y
      // reserva:ver_propias, y su dashboard entero habla de "mis solicitudes".
      '/reservations',
      '/reservations/create',
      '/calendar',
      '/eventos',
      '/eventos/:id'
    ],
    sidebarItems: [
      'dashboard',
      'reservations',
      'calendar',
      'eventos'
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
      '/statistics',
      '/sostenibilidad',
      '/configuracion'
    ],
    sidebarItems: [
      'dashboard',
      'rooms',
      'calendar',
      'inventory',
      'inventory-requests',
      'statistics',
      'sostenibilidad',
      'configuracion'
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
