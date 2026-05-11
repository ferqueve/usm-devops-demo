import { useAuth } from '@/hooks/useAuth';
import { canAccessRoute, getUserPermissions, type Role } from '@/lib/config/constants';
import {
  hasPermission,
  getRolePermissions,
  hasAnyPermission,
  hasAllPermissions,
  permissionHelpers,
  type Permission,
  type Resource,
} from '@/lib/config/permissions';

/**
 * Hook personalizado para verificar permisos y roles del usuario
 *
 * IMPORTANTE: Sincronizado con backend/src/main/java/com/utec/backend/security/RolePermissions.java
 */
export function useRolePermissions() {
  const { user } = useAuth();
  const userRole = user?.rol as Role | null;

  const permissions = getUserPermissions(userRole);
  const rolePermissions = getRolePermissions(userRole);

  const canAccess = (route: string) => {
    return canAccessRoute(userRole, route);
  };

  const hasRole = (role: Role) => {
    return user?.rol === role;
  };

  const hasAnyRole = (roles: Role[]) => {
    return user?.rol ? roles.includes(user.rol as Role) : false;
  };

  // Funciones de permisos granulares
  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(userRole, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    return hasAnyPermission(userRole, permissions);
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    return hasAllPermissions(userRole, permissions);
  };

  // Funciones de conveniencia por recurso
  const canCreate = (resource: Resource): boolean => {
    return permissionHelpers.canCreate(userRole, resource);
  };

  const canRead = (resource: Resource): boolean => {
    return permissionHelpers.canRead(userRole, resource);
  };

  const canEdit = (resource: Resource): boolean => {
    return permissionHelpers.canEdit(userRole, resource);
  };

  const canDelete = (resource: Resource): boolean => {
    return permissionHelpers.canDelete(userRole, resource);
  };

  const canApprove = (resource: Resource): boolean => {
    return permissionHelpers.canApprove(userRole, resource);
  };

  const canCancel = (resource: Resource): boolean => {
    return permissionHelpers.canCancel(userRole, resource);
  };

  const canRequest = (resource: Resource): boolean => {
    return permissionHelpers.canRequest(userRole, resource);
  };

  const canAssign = (resource: Resource): boolean => {
    return permissionHelpers.canAssign(userRole, resource);
  };

  const canManage = (resource: Resource): boolean => {
    return permissionHelpers.canManage(userRole, resource);
  };

  const canViewOwn = (resource: Resource): boolean => {
    return permissionHelpers.canViewOwn(userRole, resource);
  };

  const canViewAll = (resource: Resource): boolean => {
    return permissionHelpers.canViewAll(userRole, resource);
  };

  const canUpload = (resource: Resource): boolean => {
    return permissionHelpers.canUpload(userRole, resource);
  };

  const canManageState = (resource: Resource): boolean => {
    return permissionHelpers.canManageState(userRole, resource);
  };

  const canViewStatistics = (resource: Resource): boolean => {
    return permissionHelpers.canViewStatistics(userRole, resource);
  };

  // Función genérica para verificar acceso a funcionalidades
  // Mapeo de funcionalidades legacy a los nuevos permisos del backend
  const canAccessFeature = (feature: string): boolean => {
    const featurePermissionMap: Record<string, Permission> = {
      // Inventario
      'inventory.create': 'inventario:crear',
      'inventory.edit': 'inventario:editar',
      'inventory.delete': 'inventario:eliminar',
      'inventory.assign': 'inventario:asignar',
      'inventory.view': 'inventario:ver',

      // Espacios
      'spaces.create': 'espacio:crear',
      'spaces.edit': 'espacio:editar',
      'spaces.delete': 'espacio:eliminar',
      'spaces.view': 'espacio:ver',

      // Reservas
      'reservations.create': 'reserva:crear',
      'reservations.cancel': 'reserva:cancelar',
      'reservations.approve': 'reserva:aprobar',
      'reservations.view_own': 'reserva:ver_propias',
      'reservations.view_all': 'reserva:ver_todas',

      // Solicitudes de inventario
      'inventory_requests.view': 'solicitud_inventario:ver',
      'inventory_requests.approve': 'solicitud_inventario:aprobar',

      // Usuarios
      'users.manage': 'usuario:gestionar',
      'users.view_analysts': 'usuario:ver_analistas',

      // Estadísticas
      'statistics.view': 'estadisticas:ver',
      'statistics.view_reservations': 'estadisticas:ver_reservas',
      'statistics.view_inventory': 'estadisticas:ver_inventario',
      'statistics.view_spaces': 'estadisticas:ver_espacios',

      // Tipos
      'types.create': 'tipo:crear',
      'types.edit': 'tipo:editar',
      'types.delete': 'tipo:eliminar',
      'types.view': 'tipo:ver',

      // Carreras
      'careers.view': 'carrera:ver',
      'careers.create': 'carrera:crear',
      'careers.edit': 'carrera:editar',
      'careers.delete': 'carrera:eliminar',

      // Recomendaciones
      'recommendations.view': 'recomendacion:ver',
      'recommendations.request': 'recomendacion:solicitar',
      'recommendations.view_statistics': 'recomendacion:ver_estadisticas',
      'recommendations.manage_state': 'recomendacion:gestionar_estado',

      // Archivos
      'files.view': 'archivo:ver',
      'files.upload': 'archivo:subir',

      // Sistema
      'system.access': 'sistema:acceder',

      // Auditoría
      'audit.view': 'auditoria:ver',
    };

    const permission = featurePermissionMap[feature];
    return permission ? checkPermission(permission) : false;
  };

  return {
    // Permisos de ruta (legacy)
    permissions,
    canAccess,
    hasRole,
    hasAnyRole,
    userRole,

    // Permisos granulares
    rolePermissions,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,

    // Funciones de conveniencia por recurso
    canCreate,
    canRead,
    canEdit,
    canDelete,
    canApprove,
    canCancel,
    canRequest,
    canAssign,
    canManage,
    canViewOwn,
    canViewAll,
    canUpload,
    canManageState,
    canViewStatistics,

    // Funciones de funcionalidades
    canAccessFeature,
  };
}
