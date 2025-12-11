import { ROLES, type Role } from './constants';

/**
 * Tipos de permisos del sistema
 * Formato: modulo:accion
 */
export type Permission =
  // Inventario
  | 'inventario:crear'
  | 'inventario:leer'
  | 'inventario:editar'
  | 'inventario:eliminar'
  | 'inventario:asignar'
  | 'inventario:exportar'
  | 'inventario:importar'
  // Espacios
  | 'espacios:crear'
  | 'espacios:leer'
  | 'espacios:editar'
  | 'espacios:eliminar'
  | 'espacios:gestionar_estado'
  // Reservas
  | 'reservas:crear'
  | 'reservas:leer'
  | 'reservas:editar'
  | 'reservas:eliminar'
  | 'reservas:aprobar'
  | 'reservas:cancelar'
  | 'reservas:solicitar'
  // Solicitudes de Inventario
  | 'solicitudes_inventario:crear'
  | 'solicitudes_inventario:leer'
  | 'solicitudes_inventario:aprobar'
  | 'solicitudes_inventario:rechazar'
  | 'solicitudes_inventario:entregar'
  // Usuarios
  | 'usuarios:gestionar'
  | 'usuarios:ver'
  // Estadísticas
  | 'estadisticas:ver'
  | 'estadisticas:exportar'
  // Sistema
  | 'sistema:acceder'
  // Tipos
  | 'tipos_elemento:crear'
  | 'tipos_elemento:leer'
  | 'tipos_elemento:editar'
  | 'tipos_elemento:eliminar'
  | 'tipos_espacio:crear'
  | 'tipos_espacio:leer'
  | 'tipos_espacio:editar'
  | 'tipos_espacio:eliminar'
  // Carreras
  | 'carreras:gestionar';

/**
 * Mapeo de permisos por rol
 * Basado en ROLES_AND_PERMISSIONS.md
 */
export const ROLE_PERMISSIONS_MAP: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: [
    // Inventario - Acceso completo
    'inventario:crear',
    'inventario:leer',
    'inventario:editar',
    'inventario:eliminar',
    'inventario:asignar',
    'inventario:exportar',
    'inventario:importar',
    // Espacios - Acceso completo
    'espacios:crear',
    'espacios:leer',
    'espacios:editar',
    'espacios:eliminar',
    'espacios:gestionar_estado',
    // Reservas - Acceso completo
    'reservas:crear',
    'reservas:leer',
    'reservas:editar',
    'reservas:eliminar',
    'reservas:aprobar',
    'reservas:cancelar',
    'reservas:solicitar',
    // Solicitudes de Inventario - Acceso completo
    'solicitudes_inventario:crear',
    'solicitudes_inventario:leer',
    'solicitudes_inventario:aprobar',
    'solicitudes_inventario:rechazar',
    'solicitudes_inventario:entregar',
    // Usuarios - Acceso completo
    'usuarios:gestionar',
    'usuarios:ver',
    // Estadísticas - Acceso completo
    'estadisticas:ver',
    'estadisticas:exportar',
    // Sistema - Acceso exclusivo
    'sistema:acceder',
    // Tipos - Acceso completo
    'tipos_elemento:crear',
    'tipos_elemento:leer',
    'tipos_elemento:editar',
    'tipos_elemento:eliminar',
    'tipos_espacio:crear',
    'tipos_espacio:leer',
    'tipos_espacio:editar',
    'tipos_espacio:eliminar',
    // Carreras - Acceso completo
    'carreras:gestionar',
  ],
  [ROLES.ANALISTA]: [
    // Inventario - Solo lectura
    'inventario:leer',
    // Espacios - Solo lectura
    'espacios:leer',
    // Reservas - CRUD completo
    'reservas:crear',
    'reservas:leer',
    'reservas:editar',
    'reservas:eliminar',
    'reservas:aprobar',
    'reservas:cancelar',
    'reservas:solicitar',
    // Estadísticas - Solo reservas
    'estadisticas:ver',
    'estadisticas:exportar',
    // Tipos - Solo lectura (para ver al crear reservas/solicitudes)
    'tipos_elemento:leer',
    'tipos_espacio:leer',
  ],
  [ROLES.MANTENIMIENTO]: [
    // Inventario - Gestión completa (excepto eliminar)
    'inventario:crear',
    'inventario:leer',
    'inventario:editar',
    'inventario:asignar',
    'inventario:exportar',
    'inventario:importar',
    // Espacios - Gestión completa (excepto eliminar)
    'espacios:crear',
    'espacios:leer',
    'espacios:editar',
    'espacios:gestionar_estado',
    // Reservas - Solo lectura (para conocer ocupación)
    'reservas:leer',
    // Solicitudes de Inventario - Aprobar/rechazar/entregar
    'solicitudes_inventario:leer',
    'solicitudes_inventario:aprobar',
    'solicitudes_inventario:rechazar',
    'solicitudes_inventario:entregar',
    // Estadísticas - Inventario y espacios
    'estadisticas:ver',
    'estadisticas:exportar',
    // Tipos - Crear, leer, editar y eliminar
    'tipos_elemento:crear',
    'tipos_elemento:leer',
    'tipos_elemento:editar',
    'tipos_elemento:eliminar',
    'tipos_espacio:crear',
    'tipos_espacio:leer',
    'tipos_espacio:editar',
  ],
  [ROLES.DOCENTE]: [
    // Reservas - Ver todas y solicitar
    'reservas:leer',
    'reservas:solicitar',
    'reservas:cancelar', // Puede cancelar sus propias reservas
    // Espacios - Solo lectura
    'espacios:leer',
  ],
  [ROLES.ESTUDIANTE]: [
    // Reservas - Solo lectura
    'reservas:leer',
    // Espacios - Solo lectura
    'espacios:leer',
  ],
  [ROLES.EXTERNO]: [
    // Reservas - Solicitar y ver públicas
    'reservas:solicitar',
    'reservas:leer', // Solo reservas públicas/aprobadas
    // Espacios - Solo lectura básica
    'espacios:leer',
  ],
};

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: Role | null, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS_MAP[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Obtiene todos los permisos de un rol
 */
export function getRolePermissions(role: Role | null): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS_MAP[role] || [];
}

/**
 * Verifica si un rol tiene alguno de los permisos especificados
 */
export function hasAnyPermission(role: Role | null, permissions: Permission[]): boolean {
  if (!role || permissions.length === 0) return false;
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Verifica si un rol tiene todos los permisos especificados
 */
export function hasAllPermissions(role: Role | null, permissions: Permission[]): boolean {
  if (!role || permissions.length === 0) return false;
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Recursos del sistema para funciones de conveniencia
 */
export type Resource = 'inventario' | 'espacios' | 'reservas' | 'solicitudes_inventario' | 'usuarios' | 'estadisticas' | 'sistema' | 'tipos_elemento' | 'tipos_espacio' | 'carreras';

/**
 * Funciones de conveniencia para verificar permisos por recurso
 */
export const permissionHelpers = {
  canCreate: (role: Role | null, resource: Resource): boolean => {
    return hasPermission(role, `${resource}:crear` as Permission);
  },
  canRead: (role: Role | null, resource: Resource): boolean => {
    return hasPermission(role, `${resource}:leer` as Permission);
  },
  canEdit: (role: Role | null, resource: Resource): boolean => {
    return hasPermission(role, `${resource}:editar` as Permission);
  },
  canDelete: (role: Role | null, resource: Resource): boolean => {
    return hasPermission(role, `${resource}:eliminar` as Permission);
  },
  canApprove: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'reservas') {
      return hasPermission(role, 'reservas:aprobar');
    }
    if (resource === 'solicitudes_inventario') {
      return hasPermission(role, 'solicitudes_inventario:aprobar');
    }
    return false;
  },
  canCancel: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'reservas') {
      return hasPermission(role, 'reservas:cancelar');
    }
    return false;
  },
  canRequest: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'reservas') {
      return hasPermission(role, 'reservas:solicitar');
    }
    if (resource === 'solicitudes_inventario') {
      return hasPermission(role, 'solicitudes_inventario:crear');
    }
    return false;
  },
  canReject: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'solicitudes_inventario') {
      return hasPermission(role, 'solicitudes_inventario:rechazar');
    }
    return false;
  },
  canDeliver: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'solicitudes_inventario') {
      return hasPermission(role, 'solicitudes_inventario:entregar');
    }
    return false;
  },
  canAssign: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'inventario') {
      return hasPermission(role, 'inventario:asignar');
    }
    return false;
  },
  canExport: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'inventario' || resource === 'estadisticas') {
      return hasPermission(role, `${resource}:exportar` as Permission);
    }
    return false;
  },
  canManageState: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'espacios') {
      return hasPermission(role, 'espacios:gestionar_estado');
    }
    return false;
  },
};

