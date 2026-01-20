import { ROLES, type Role } from './constants';

/**
 * Tipos de permisos del sistema
 * Formato: modulo:accion
 *
 * IMPORTANTE: Estos permisos deben coincidir exactamente con los definidos en:
 * backend/src/main/java/com/utec/backend/security/RolePermissions.java
 */
export type Permission =
  // Reservas
  | 'reserva:crear'
  | 'reserva:ver_propias'
  | 'reserva:ver_todas'
  | 'reserva:editar'
  | 'reserva:cancelar'
  | 'reserva:aprobar'
  // Espacios
  | 'espacio:ver'
  | 'espacio:crear'
  | 'espacio:editar'
  | 'espacio:eliminar'
  // Inventario
  | 'inventario:ver'
  | 'inventario:crear'
  | 'inventario:editar'
  | 'inventario:eliminar'
  | 'inventario:asignar'
  // Tipos (TipoElemento, TipoEspacio)
  | 'tipo:ver'
  | 'tipo:crear'
  | 'tipo:editar'
  | 'tipo:eliminar'
  // Carreras
  | 'carrera:ver'
  | 'carrera:crear'
  | 'carrera:editar'
  | 'carrera:eliminar'
  // Solicitudes de Inventario
  | 'solicitud_inventario:ver'
  | 'solicitud_inventario:crear'
  | 'solicitud_inventario:aprobar'
  | 'solicitud_inventario:rechazar'
  | 'solicitud_inventario:entregar'
  // Estadísticas
  | 'estadisticas:ver'
  | 'estadisticas:ver_reservas'
  | 'estadisticas:ver_inventario'
  | 'estadisticas:ver_espacios'
  | 'estadisticas:exportar'
  // Recomendaciones
  | 'recomendacion:ver'
  | 'recomendacion:solicitar'
  | 'recomendacion:ver_estadisticas'
  | 'recomendacion:gestionar_estado'
  // Usuarios
  | 'usuario:ver'
  | 'usuario:ver_analistas'
  | 'usuario:crear'
  | 'usuario:editar'
  | 'usuario:eliminar'
  | 'usuario:gestionar'
  // Archivos
  | 'archivo:ver'
  | 'archivo:subir'
  // Sistema
  | 'sistema:acceder'
  // Auditoría
  | 'auditoria:ver';

/**
 * Mapeo de permisos por rol
 * Sincronizado con backend/src/main/java/com/utec/backend/security/RolePermissions.java
 */
export const ROLE_PERMISSIONS_MAP: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: [
    // ADMIN tiene acceso completo a todo (wildcard "*" en backend)
    // Listamos todos los permisos explícitamente para el frontend

    // Reservas - Acceso completo
    'reserva:crear',
    'reserva:ver_propias',
    'reserva:ver_todas',
    'reserva:editar',
    'reserva:cancelar',
    'reserva:aprobar',

    // Espacios - Acceso completo
    'espacio:ver',
    'espacio:crear',
    'espacio:editar',
    'espacio:eliminar',

    // Inventario - Acceso completo
    'inventario:ver',
    'inventario:crear',
    'inventario:editar',
    'inventario:eliminar',
    'inventario:asignar',

    // Tipos - Acceso completo
    'tipo:ver',
    'tipo:crear',
    'tipo:editar',
    'tipo:eliminar',

    // Carreras - Acceso completo
    'carrera:ver',
    'carrera:crear',
    'carrera:editar',
    'carrera:eliminar',

    // Solicitudes de Inventario - Acceso completo
    'solicitud_inventario:ver',
    'solicitud_inventario:crear',
    'solicitud_inventario:aprobar',
    'solicitud_inventario:rechazar',
    'solicitud_inventario:entregar',

    // Estadísticas - Acceso completo
    'estadisticas:ver',
    'estadisticas:ver_reservas',
    'estadisticas:ver_inventario',
    'estadisticas:ver_espacios',
    'estadisticas:exportar',

    // Recomendaciones - Acceso completo
    'recomendacion:ver',
    'recomendacion:solicitar',
    'recomendacion:ver_estadisticas',
    'recomendacion:gestionar_estado',

    // Usuarios - Acceso completo
    'usuario:ver',
    'usuario:ver_analistas',
    'usuario:crear',
    'usuario:editar',
    'usuario:eliminar',
    'usuario:gestionar',

    // Archivos - Acceso completo
    'archivo:ver',
    'archivo:subir',

    // Sistema - Acceso exclusivo
    'sistema:acceder',

    // Auditoría - Acceso completo
    'auditoria:ver',
  ],

  [ROLES.ANALISTA]: [
    // Reservas - CRUD completo
    'reserva:crear',
    'reserva:ver_propias',
    'reserva:ver_todas',
    'reserva:editar',
    'reserva:cancelar',
    'reserva:aprobar',

    // Espacios - Solo lectura
    'espacio:ver',

    // Inventario - Solo lectura
    'inventario:ver',

    // Tipos - Solo lectura
    'tipo:ver',

    // Carreras - CRUD
    'carrera:ver',
    'carrera:crear',
    'carrera:editar',
    'carrera:eliminar',

    // Estadísticas - Reservas
    'estadisticas:ver',
    'estadisticas:ver_reservas',

    // Recomendaciones
    'recomendacion:ver',
    'recomendacion:solicitar',
    'recomendacion:ver_estadisticas',

    // Usuarios
    'usuario:ver_analistas',

    // Archivos
    'archivo:ver',
    'archivo:subir',
  ],

  [ROLES.MANTENIMIENTO]: [
    // Reservas - Solo lectura (para ver ocupación)
    'reserva:ver_todas',

    // Espacios - CRUD (excepto eliminar)
    'espacio:ver',
    'espacio:crear',
    'espacio:editar',

    // Inventario - CRUD completo
    'inventario:ver',
    'inventario:crear',
    'inventario:editar',
    'inventario:eliminar',
    'inventario:asignar',

    // Tipos - CRUD (excepto eliminar)
    'tipo:ver',
    'tipo:crear',
    'tipo:editar',

    // Solicitudes de inventario
    'solicitud_inventario:ver',
    'solicitud_inventario:aprobar',

    // Estadísticas - Inventario y espacios
    'estadisticas:ver',
    'estadisticas:ver_inventario',
    'estadisticas:ver_espacios',

    // Recomendaciones - gestionar estado
    'recomendacion:gestionar_estado',

    // Archivos
    'archivo:ver',
    'archivo:subir',
  ],

  [ROLES.DOCENTE]: [
    // Reservas - crear solicitudes y ver
    'reserva:crear',
    'reserva:ver_propias',
    'reserva:ver_todas',
    'reserva:cancelar',

    // Espacios - Solo lectura
    'espacio:ver',

    // Tipos - Solo lectura
    'tipo:ver',

    // Carreras - Solo lectura
    'carrera:ver',

    // Recomendaciones
    'recomendacion:ver',
    'recomendacion:solicitar',

    // Usuarios
    'usuario:ver_analistas',

    // Archivos - Solo lectura
    'archivo:ver',
  ],

  [ROLES.ESTUDIANTE]: [
    // Reservas - Solo ver
    'reserva:ver_todas',

    // Espacios - Solo lectura
    'espacio:ver',

    // Tipos - Solo lectura
    'tipo:ver',

    // Carreras - Solo lectura
    'carrera:ver',

    // Estadísticas básicas
    'estadisticas:ver',

    // Archivos - Solo lectura
    'archivo:ver',
  ],

  [ROLES.EXTERNO]: [
    // Reservas - crear solicitudes y ver propias
    'reserva:crear',
    'reserva:ver_propias',
    'reserva:ver_todas',
    'reserva:cancelar',

    // Espacios - Solo lectura
    'espacio:ver',

    // Tipos - Solo lectura
    'tipo:ver',

    // Carreras - Solo lectura
    'carrera:ver',

    // Archivos - Solo lectura
    'archivo:ver',
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
export type Resource =
  | 'reserva'
  | 'espacio'
  | 'inventario'
  | 'tipo'
  | 'carrera'
  | 'solicitud_inventario'
  | 'estadisticas'
  | 'recomendacion'
  | 'usuario'
  | 'archivo'
  | 'sistema'
  | 'auditoria';

/**
 * Funciones de conveniencia para verificar permisos por recurso
 */
export const permissionHelpers = {
  canCreate: (role: Role | null, resource: Resource): boolean => {
    return hasPermission(role, `${resource}:crear` as Permission);
  },
  canRead: (role: Role | null, resource: Resource): boolean => {
    // Para recursos que usan "ver" en lugar de "leer"
    if (resource === 'reserva') {
      return hasAnyPermission(role, ['reserva:ver_propias' as Permission, 'reserva:ver_todas' as Permission]);
    }
    return hasPermission(role, `${resource}:ver` as Permission);
  },
  canEdit: (role: Role | null, resource: Resource): boolean => {
    return hasPermission(role, `${resource}:editar` as Permission);
  },
  canDelete: (role: Role | null, resource: Resource): boolean => {
    return hasPermission(role, `${resource}:eliminar` as Permission);
  },
  canApprove: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'reserva') {
      return hasPermission(role, 'reserva:aprobar');
    }
    if (resource === 'solicitud_inventario') {
      return hasPermission(role, 'solicitud_inventario:aprobar');
    }
    return false;
  },
  canCancel: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'reserva') {
      return hasPermission(role, 'reserva:cancelar');
    }
    return false;
  },
  canRequest: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'reserva') {
      return hasPermission(role, 'reserva:crear');
    }
    if (resource === 'solicitud_inventario') {
      return hasPermission(role, 'solicitud_inventario:crear');
    }
    if (resource === 'recomendacion') {
      return hasPermission(role, 'recomendacion:solicitar');
    }
    return false;
  },
  canReject: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'solicitud_inventario') {
      return hasPermission(role, 'solicitud_inventario:rechazar');
    }
    return false;
  },
  canDeliver: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'solicitud_inventario') {
      return hasPermission(role, 'solicitud_inventario:entregar');
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
    if (resource === 'estadisticas') {
      return hasPermission(role, 'estadisticas:exportar');
    }
    return false;
  },
  canManage: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'usuario') {
      return hasPermission(role, 'usuario:gestionar');
    }
    return false;
  },
  canViewOwn: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'reserva') {
      return hasPermission(role, 'reserva:ver_propias');
    }
    return false;
  },
  canViewAll: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'reserva') {
      return hasPermission(role, 'reserva:ver_todas');
    }
    return false;
  },
  canUpload: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'archivo') {
      return hasPermission(role, 'archivo:subir');
    }
    return false;
  },
  canManageState: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'recomendacion') {
      return hasPermission(role, 'recomendacion:gestionar_estado');
    }
    return false;
  },
  canViewStatistics: (role: Role | null, resource: Resource): boolean => {
    if (resource === 'estadisticas') {
      return hasPermission(role, 'estadisticas:ver');
    }
    if (resource === 'recomendacion') {
      return hasPermission(role, 'recomendacion:ver_estadisticas');
    }
    return false;
  },
};
