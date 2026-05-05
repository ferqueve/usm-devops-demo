import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { canAccessRoute, getUserPermissions } from '@/lib/config/constants';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export default function RoleProtectedRoute({ 
  children, 
  fallbackPath = '/dashboard' 
}: Readonly<RoleProtectedRouteProps>) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

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

  // Verificar si el usuario puede acceder a la ruta actual
  const canAccess = canAccessRoute(user.rol, location.pathname);
  
  if (!canAccess) {
    // Redirigir a la primera ruta permitida para el usuario
    const permissions = getUserPermissions(user.rol);
    const firstAllowedRoute = permissions?.routes[0] || fallbackPath;
    return <Navigate to={firstAllowedRoute} replace />;
  }

  // Si puede acceder, mostrar el contenido
  return <>{children}</>;
}

