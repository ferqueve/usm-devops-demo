import React from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import type { Permission } from '@/lib/config/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // Si true, requiere todos los permisos; si false, requiere al menos uno
  fallback?: React.ReactNode; // Contenido a mostrar si no tiene permisos (por defecto null = ocultar)
  showFallback?: boolean; // Si true, muestra fallback; si false, oculta completamente
}

/**
 * Componente que muestra u oculta contenido según los permisos del usuario
 * 
 * @example
 * // Ocultar botón si no tiene permiso
 * <PermissionGuard requiredPermission="inventario:crear">
 *   <Button>Crear Item</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Mostrar mensaje si no tiene permiso
 * <PermissionGuard 
 *   requiredPermission="inventario:editar"
 *   fallback={<p>No tienes permiso para editar</p>}
 *   showFallback={true}
 * >
 *   <Button>Editar</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Requiere cualquiera de los permisos
 * <PermissionGuard 
 *   requiredPermissions={['inventario:editar', 'inventario:eliminar']}
 *   requireAll={false}
 * >
 *   <Button>Acción</Button>
 * </PermissionGuard>
 */
export default function PermissionGuard({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback = null,
  showFallback = false,
}: Readonly<PermissionGuardProps>) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRolePermissions();

  // Verificar permiso único
  if (requiredPermission) {
    const hasAccess = hasPermission(requiredPermission);
    if (!hasAccess) {
      return showFallback ? <>{fallback}</> : null;
    }
    return <>{children}</>;
  }

  // Verificar múltiples permisos
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasAccess) {
      return showFallback ? <>{fallback}</> : null;
    }
    return <>{children}</>;
  }

  // Si no se especificó ningún permiso, mostrar siempre
  return <>{children}</>;
}

