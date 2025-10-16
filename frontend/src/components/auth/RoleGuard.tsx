import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute, getUserPermissions, type Role } from '@/lib/config/constants';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: Role;
  requiredRoles?: Role[];
  fallbackPath?: string;
}

export default function RoleGuard({ 
  children, 
  requiredRole, 
  requiredRoles, 
  fallbackPath = '/dashboard' 
}: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar rol específico
  if (requiredRole && user.rol !== requiredRole) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Verificar múltiples roles
  if (requiredRoles && !requiredRoles.includes(user.rol as Role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Si pasa todas las verificaciones, mostrar el contenido
  return <>{children}</>;
}

// Hook personalizado para verificar permisos
export function useRolePermissions() {
  const { user } = useAuth();
  
  const permissions = getUserPermissions(user?.rol || null);
  
  const canAccess = (route: string) => {
    return canAccessRoute(user?.rol || null, route);
  };

  const hasRole = (role: Role) => {
    return user?.rol === role;
  };

  const hasAnyRole = (roles: Role[]) => {
    return user?.rol ? roles.includes(user.rol as Role) : false;
  };

  return {
    permissions,
    canAccess,
    hasRole,
    hasAnyRole,
    userRole: user?.rol || null
  };
}

