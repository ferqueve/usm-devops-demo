import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/lib/config/constants';

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
}: Readonly<RoleGuardProps>) {
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

