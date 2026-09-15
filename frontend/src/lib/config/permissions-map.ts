import type { Permission } from './permissions';

/**
 * Mapeo de permisos requeridos por componente/página
 *
 * Este archivo documenta qué permisos necesita cada componente o página
 * para facilitar la auditoría y mantenimiento futuro del sistema de permisos.
 *
 * Formato: componente/página -> array de permisos requeridos
 *
 * IMPORTANTE: Sincronizado con backend/src/main/java/com/utec/backend/security/RolePermissions.java
 */

// ===== GRUPOS DE PERMISOS REUTILIZABLES =====
//
// Cada grupo agrupa los permisos que típicamente comparte un set de componentes
// del mismo subsistema. Los componentes individuales se construyen combinando
// estos grupos para evitar repetir las mismas listas en cada entrada.

const INVENTORY_VIEW_EDIT_PERMS: Permission[] = [
  'inventario:ver',
  'inventario:editar',
  'inventario:eliminar',
  'inventario:asignar',
];

const INVENTORY_FULL_PERMS: Permission[] = [
  'inventario:ver',
  'inventario:crear',
  'inventario:editar',
  'inventario:eliminar',
  'inventario:asignar',
];

const INVENTORY_FORM_PERMS: Permission[] = ['inventario:crear', 'inventario:editar'];

const INVENTORY_REQUEST_PERMS: Permission[] = [
  'solicitud_inventario:ver',
  'solicitud_inventario:aprobar',
];

const SPACE_VIEW_EDIT_PERMS: Permission[] = [
  'espacio:ver',
  'espacio:editar',
  'espacio:eliminar',
];

const SPACE_FULL_PERMS: Permission[] = [
  'espacio:ver',
  'espacio:crear',
  'espacio:editar',
  'espacio:eliminar',
];

const SPACE_FORM_PERMS: Permission[] = ['espacio:crear', 'espacio:editar'];

const TIPO_CRUD_PERMS: Permission[] = ['tipo:crear', 'tipo:editar', 'tipo:eliminar'];
const TIPO_FORM_PERMS: Permission[] = ['tipo:crear', 'tipo:editar'];

// Permisos típicos de listados de reservas (cards, tablas, gestión)
const RESERVATION_LIST_PERMS: Permission[] = [
  'reserva:ver_propias',
  'reserva:ver_todas',
  'reserva:aprobar',
  'reserva:cancelar',
];

const RESERVATION_FORM_PERMS: Permission[] = ['reserva:crear'];

// Componentes de estadística que comparten "ver_<area> + ver" para exportar
const buildStatsPerms = (specific: Permission): Permission[] => [specific, 'estadisticas:ver'];

export const COMPONENT_PERMISSIONS_MAP: Record<string, Permission[]> = {
  // ===== PÁGINAS =====
  '/dashboard': [],
  '/calendar': [],
  '/reservations': ['reserva:ver_propias', 'reserva:ver_todas'],
  '/rooms': ['espacio:ver'],
  '/rooms/:id': ['espacio:ver'],
  '/inventory': ['inventario:ver'],
  '/inventory/requests': ['solicitud_inventario:ver'],
  '/statistics': ['estadisticas:ver'],
  '/predicciones': ['estadisticas:ver_reservas'],
  '/users': ['usuario:gestionar'],
  '/system': ['sistema:acceder'],
  '/audit': ['auditoria:ver'],

  // ===== COMPONENTES DE INVENTARIO =====
  InventoryManagement: INVENTORY_FULL_PERMS,
  InventoryTable: INVENTORY_VIEW_EDIT_PERMS,
  InventoryCardView: INVENTORY_VIEW_EDIT_PERMS,
  InventoryFormDialog: INVENTORY_FORM_PERMS,

  // ===== COMPONENTES DE SOLICITUDES DE INVENTARIO =====
  InventoryRequestsManagement: INVENTORY_REQUEST_PERMS,
  InventoryRequestsCardView: INVENTORY_REQUEST_PERMS,

  // ===== COMPONENTES DE ESPACIOS =====
  SpacesManagement: SPACE_FULL_PERMS,
  SpaceCard: SPACE_VIEW_EDIT_PERMS,
  SpaceTable: SPACE_VIEW_EDIT_PERMS,
  SpaceFormDialog: SPACE_FORM_PERMS,
  TipoEspacioManagement: TIPO_CRUD_PERMS,

  // ===== COMPONENTES DE RESERVAS =====
  ReservationManagement: ['reserva:crear', ...RESERVATION_LIST_PERMS],
  ReservationCardView: RESERVATION_LIST_PERMS,
  ReservationTableView: RESERVATION_LIST_PERMS,
  ReservationFormDialog: RESERVATION_FORM_PERMS,

  // ===== COMPONENTES DE USUARIOS =====
  UserManagement: ['usuario:gestionar', 'usuario:gestionar'],

  // ===== COMPONENTES DE ESTADÍSTICAS =====
  StatisticsPage: ['estadisticas:ver', 'estadisticas:ver'],
  ReservationStats: buildStatsPerms('estadisticas:ver_reservas'),
  // Tutorías y eventos: /stats/academico pide el mismo permiso que reservas.
  AcademicStats: buildStatsPerms('estadisticas:ver_reservas'),
  SpaceStats: buildStatsPerms('estadisticas:ver_espacios'),

  // ===== COMPONENTES DE RECOMENDACIONES =====
  RecommendationCard: ['recomendacion:ver', 'recomendacion:solicitar'],
  RecommendationStats: ['recomendacion:ver_estadisticas'],

  // ===== COMPONENTES DE TIPOS =====
  TipoElementoFormDialog: TIPO_FORM_PERMS,
  TipoEspacioFormDialog: TIPO_FORM_PERMS,

  // ===== COMPONENTES DE CARRERAS =====
  CarreraManagement: [
    'carrera:ver',
    'carrera:crear',
    'carrera:editar',
    'carrera:eliminar',
  ],

  // ===== COMPONENTES DE SISTEMA =====
  SystemPage: ['sistema:acceder'],

  // ===== COMPONENTES DE AUDITORÍA =====
  AuditPage: ['auditoria:ver'],

  // ===== COMPONENTES DE ARCHIVOS =====
  FileUpload: ['archivo:subir'],
  FileViewer: ['archivo:ver'],
};

/**
 * Obtiene los permisos requeridos para un componente o página
 */
export function getComponentPermissions(componentName: string): Permission[] {
  return COMPONENT_PERMISSIONS_MAP[componentName] || [];
}

/**
 * Verifica si un componente requiere un permiso específico
 */
export function componentRequiresPermission(
  componentName: string,
  permission: Permission
): boolean {
  const permissions = getComponentPermissions(componentName);
  return permissions.includes(permission);
}
