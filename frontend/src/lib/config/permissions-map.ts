import type { Permission } from './permissions';

/**
 * Mapeo de permisos requeridos por componente/página
 * 
 * Este archivo documenta qué permisos necesita cada componente o página
 * para facilitar la auditoría y mantenimiento futuro del sistema de permisos.
 * 
 * Formato: componente/página -> array de permisos requeridos
 */
export const COMPONENT_PERMISSIONS_MAP: Record<string, Permission[]> = {
  // ===== PÁGINAS =====
  '/dashboard': [],
  '/calendar': [],
  '/reservations': ['reservas:leer'],
  '/rooms': ['espacios:leer'],
  '/rooms/:id': ['espacios:leer'],
  '/inventory': ['inventario:leer'],
  '/inventory/requests': ['solicitudes_inventario:leer'],
  '/statistics': ['estadisticas:ver'],
  '/users': ['usuarios:ver'],
  '/system': ['sistema:acceder'],

  // ===== COMPONENTES DE INVENTARIO =====
  'InventoryManagement': [
    'inventario:leer', // Ver inventario
    'inventario:crear', // Botón crear
    'inventario:editar', // Botones editar
    'inventario:eliminar', // Botones eliminar
    'inventario:asignar', // Botones asignar/reasignar
    'inventario:exportar', // Botón exportar
    'inventario:importar', // Botón importar
  ],
  'InventoryTable': [
    'inventario:leer', // Ver tabla
    'inventario:editar', // Botón editar
    'inventario:eliminar', // Botón eliminar
    'inventario:asignar', // Botón asignar
  ],
  'InventoryCardView': [
    'inventario:leer', // Ver cards
    'inventario:editar', // Botón editar
    'inventario:eliminar', // Botón eliminar
    'inventario:asignar', // Botón asignar
  ],
  'InventoryFormDialog': [
    'inventario:crear', // Crear nuevo
    'inventario:editar', // Editar existente
  ],
  'BulkActionsBar': [
    'inventario:editar', // Cambios masivos de estado
    'inventario:asignar', // Asignación masiva
    'inventario:exportar', // Exportar seleccionados
  ],

  // ===== COMPONENTES DE SOLICITUDES DE INVENTARIO =====
  'InventoryRequestsManagement': [
    'solicitudes_inventario:leer', // Ver solicitudes
    'solicitudes_inventario:aprobar', // Botón aprobar
    'solicitudes_inventario:rechazar', // Botón rechazar
    'solicitudes_inventario:entregar', // Botón entregado
  ],
  'InventoryRequestsCardView': [
    'solicitudes_inventario:leer', // Ver cards
    'solicitudes_inventario:aprobar', // Botón aprobar
    'solicitudes_inventario:rechazar', // Botón rechazar
    'solicitudes_inventario:entregar', // Botón entregado
  ],

  // ===== COMPONENTES DE ESPACIOS =====
  'SpacesManagement': [
    'espacios:leer', // Ver espacios
    'espacios:crear', // Botón crear
    'espacios:editar', // Botones editar
    'espacios:eliminar', // Botones eliminar
    'espacios:gestionar_estado', // Cambiar estado
  ],
  'SpaceCard': [
    'espacios:leer', // Ver card
    'espacios:editar', // Botón editar
    'espacios:eliminar', // Botón eliminar
  ],
  'SpaceTable': [
    'espacios:leer', // Ver tabla
    'espacios:editar', // Botón editar
    'espacios:eliminar', // Botón eliminar
  ],
  'SpaceFormDialog': [
    'espacios:crear', // Crear nuevo
    'espacios:editar', // Editar existente
  ],
  'TipoEspacioManagement': [
    'tipos_espacio:crear', // Crear tipo
    'tipos_espacio:editar', // Editar tipo
    'tipos_espacio:eliminar', // Eliminar tipo
  ],

  // ===== COMPONENTES DE RESERVAS =====
  'ReservationManagement': [
    'reservas:leer', // Ver reservas
    'reservas:crear', // Botón crear
    'reservas:editar', // Botones editar
    'reservas:eliminar', // Botones eliminar
    'reservas:aprobar', // Botón aprobar
    'reservas:cancelar', // Botón cancelar
    'reservas:solicitar', // Solicitar reserva
  ],
  'ReservationCardView': [
    'reservas:leer', // Ver cards
    'reservas:editar', // Botón editar
    'reservas:eliminar', // Botón eliminar
    'reservas:aprobar', // Botón aprobar
    'reservas:cancelar', // Botón cancelar
  ],
  'ReservationTableView': [
    'reservas:leer', // Ver tabla
    'reservas:editar', // Botón editar
    'reservas:eliminar', // Botón eliminar
    'reservas:aprobar', // Botón aprobar
    'reservas:cancelar', // Botón cancelar
  ],
  'ReservationFormDialog': [
    'reservas:crear', // Crear nueva
    'reservas:editar', // Editar existente
    'reservas:solicitar', // Solicitar reserva
  ],

  // ===== COMPONENTES DE USUARIOS =====
  'UserManagement': [
    'usuarios:ver', // Ver usuarios
    'usuarios:gestionar', // Todas las acciones (crear, editar, eliminar, cambiar rol)
  ],

  // ===== COMPONENTES DE ESTADÍSTICAS =====
  'StatisticsPage': [
    'estadisticas:ver', // Ver estadísticas
    'estadisticas:exportar', // Exportar reportes
  ],
  'InventoryStats': [
    'estadisticas:ver', // Ver estadísticas de inventario
    'estadisticas:exportar', // Exportar reportes
  ],
  'ReservationStats': [
    'estadisticas:ver', // Ver estadísticas de reservas
    'estadisticas:exportar', // Exportar reportes
  ],

  // ===== COMPONENTES DE SISTEMA =====
  'SystemPage': [
    'sistema:acceder', // Acceso a la página
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

