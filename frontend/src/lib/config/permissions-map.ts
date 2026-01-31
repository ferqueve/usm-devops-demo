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
  '/users': ['usuario:gestionar'],
  '/system': ['sistema:acceder'],
  '/audit': ['auditoria:ver'],

  // ===== COMPONENTES DE INVENTARIO =====
  'InventoryManagement': [
    'inventario:ver', // Ver inventario
    'inventario:crear', // Botón crear
    'inventario:editar', // Botones editar
    'inventario:eliminar', // Botones eliminar
    'inventario:asignar', // Botones asignar/reasignar
  ],
  'InventoryTable': [
    'inventario:ver', // Ver tabla
    'inventario:editar', // Botón editar
    'inventario:eliminar', // Botón eliminar
    'inventario:asignar', // Botón asignar
  ],
  'InventoryCardView': [
    'inventario:ver', // Ver cards
    'inventario:editar', // Botón editar
    'inventario:eliminar', // Botón eliminar
    'inventario:asignar', // Botón asignar
  ],
  'InventoryFormDialog': [
    'inventario:crear', // Crear nuevo
    'inventario:editar', // Editar existente
  ],

  // ===== COMPONENTES DE SOLICITUDES DE INVENTARIO =====
  'InventoryRequestsManagement': [
    'solicitud_inventario:ver', // Ver solicitudes
    'solicitud_inventario:aprobar', // Aprobar/rechazar/entregar solicitudes
  ],
  'InventoryRequestsCardView': [
    'solicitud_inventario:ver', // Ver cards
    'solicitud_inventario:aprobar', // Aprobar/rechazar/entregar solicitudes
  ],

  // ===== COMPONENTES DE ESPACIOS =====
  'SpacesManagement': [
    'espacio:ver', // Ver espacios
    'espacio:crear', // Botón crear
    'espacio:editar', // Botones editar
    'espacio:eliminar', // Botones eliminar
  ],
  'SpaceCard': [
    'espacio:ver', // Ver card
    'espacio:editar', // Botón editar
    'espacio:eliminar', // Botón eliminar
  ],
  'SpaceTable': [
    'espacio:ver', // Ver tabla
    'espacio:editar', // Botón editar
    'espacio:eliminar', // Botón eliminar
  ],
  'SpaceFormDialog': [
    'espacio:crear', // Crear nuevo
    'espacio:editar', // Editar existente
  ],
  'TipoEspacioManagement': [
    'tipo:crear', // Crear tipo
    'tipo:editar', // Editar tipo
    'tipo:eliminar', // Eliminar tipo
  ],

  // ===== COMPONENTES DE RESERVAS =====
  'ReservationManagement': [
    'reserva:ver_propias', // Ver mis reservas
    'reserva:ver_todas', // Ver todas las reservas
    'reserva:crear', // Botón crear
    'reserva:editar', // Botones editar
    'reserva:aprobar', // Botón aprobar
    'reserva:cancelar', // Botón cancelar
  ],
  'ReservationCardView': [
    'reserva:ver_propias', // Ver cards propias
    'reserva:ver_todas', // Ver todas
    'reserva:editar', // Botón editar
    'reserva:aprobar', // Botón aprobar
    'reserva:cancelar', // Botón cancelar
  ],
  'ReservationTableView': [
    'reserva:ver_propias', // Ver tabla propias
    'reserva:ver_todas', // Ver todas
    'reserva:editar', // Botón editar
    'reserva:aprobar', // Botón aprobar
    'reserva:cancelar', // Botón cancelar
  ],
  'ReservationFormDialog': [
    'reserva:crear', // Crear nueva
    'reserva:editar', // Editar existente
  ],

  // ===== COMPONENTES DE USUARIOS =====
  'UserManagement': [
    'usuario:gestionar', // Ver usuarios
    'usuario:gestionar', // Todas las acciones (crear, editar, eliminar, cambiar rol)
  ],

  // ===== COMPONENTES DE ESTADÍSTICAS =====
  'StatisticsPage': [
    'estadisticas:ver', // Ver estadísticas
    'estadisticas:ver', // Exportar reportes
  ],
  'InventoryStats': [
    'estadisticas:ver_inventario', // Ver estadísticas de inventario
    'estadisticas:ver', // Exportar reportes
  ],
  'ReservationStats': [
    'estadisticas:ver_reservas', // Ver estadísticas de reservas
    'estadisticas:ver', // Exportar reportes
  ],
  'SpaceStats': [
    'estadisticas:ver_espacios', // Ver estadísticas de espacios
    'estadisticas:ver', // Exportar reportes
  ],

  // ===== COMPONENTES DE RECOMENDACIONES =====
  'RecommendationCard': [
    'recomendacion:ver', // Ver recomendaciones
    'recomendacion:solicitar', // Solicitar recomendaciones
  ],
  'RecommendationStats': [
    'recomendacion:ver_estadisticas', // Ver estadísticas de recomendaciones
  ],

  // ===== COMPONENTES DE TIPOS =====
  'TipoElementoFormDialog': [
    'tipo:crear', // Crear tipo elemento
    'tipo:editar', // Editar tipo elemento
  ],
  'TipoEspacioFormDialog': [
    'tipo:crear', // Crear tipo espacio
    'tipo:editar', // Editar tipo espacio
  ],

  // ===== COMPONENTES DE CARRERAS =====
  'CarreraManagement': [
    'carrera:ver', // Ver carreras
    'carrera:crear', // Crear carrera
    'carrera:editar', // Editar carrera
    'carrera:eliminar', // Eliminar carrera
  ],

  // ===== COMPONENTES DE SISTEMA =====
  'SystemPage': [
    'sistema:acceder', // Acceso a la página
  ],

  // ===== COMPONENTES DE AUDITORÍA =====
  'AuditPage': [
    'auditoria:ver', // Ver logs de auditoría
  ],

  // ===== COMPONENTES DE ARCHIVOS =====
  'FileUpload': [
    'archivo:subir', // Subir archivos
  ],
  'FileViewer': [
    'archivo:ver', // Ver archivos
  ],
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
