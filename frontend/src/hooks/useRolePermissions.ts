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

  const canReject = (resource: Resource): boolean => {
    return permissionHelpers.canReject(userRole, resource);
  };

  const canDeliver = (resource: Resource): boolean => {
    return permissionHelpers.canDeliver(userRole, resource);
  };

  const canAssign = (resource: Resource): boolean => {
    return permissionHelpers.canAssign(userRole, resource);
  };

  const canExport = (resource: Resource): boolean => {
    return permissionHelpers.canExport(userRole, resource);
  };

  const canManageState = (resource: Resource): boolean => {
    return permissionHelpers.canManageState(userRole, resource);
  };

  // Función genérica para verificar acceso a funcionalidades
  const canAccessFeature = (feature: string): boolean => {
    // Mapeo de funcionalidades a permisos
    const featurePermissionMap: Record<string, Permission> = {
      'inventory.create': 'inventario:crear',
      'inventory.edit': 'inventario:editar',
      'inventory.delete': 'inventario:eliminar',
      'inventory.assign': 'inventario:asignar',
      'inventory.export': 'inventario:exportar',
      'spaces.create': 'espacios:crear',
      'spaces.edit': 'espacios:editar',
      'spaces.delete': 'espacios:eliminar',
      'spaces.manage_state': 'espacios:gestionar_estado',
      'reservations.create': 'reservas:crear',
      'reservations.edit': 'reservas:editar',
      'reservations.delete': 'reservas:eliminar',
      'reservations.approve': 'reservas:aprobar',
      'reservations.cancel': 'reservas:cancelar',
      'reservations.request': 'reservas:solicitar',
      'inventory_requests.approve': 'solicitudes_inventario:aprobar',
      'inventory_requests.reject': 'solicitudes_inventario:rechazar',
      'inventory_requests.deliver': 'solicitudes_inventario:entregar',
      'users.manage': 'usuarios:gestionar',
      'statistics.view': 'estadisticas:ver',
      'statistics.export': 'estadisticas:exportar',
      'system.access': 'sistema:acceder',
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
    canReject,
    canDeliver,
    canAssign,
    canExport,
    canManageState,
    
    // Funciones de funcionalidades
    canAccessFeature,
  };
}

