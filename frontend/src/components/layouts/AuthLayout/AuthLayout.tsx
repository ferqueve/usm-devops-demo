import { Outlet } from 'react-router-dom';
import { AuthHeader } from './AuthHeader';
import { AuthSidePanel } from './AuthSidePanel';
import { AuthLoading } from './AuthLoading';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

// Tipos para el layout
interface AuthLayoutProps {
  children?: ReactNode;
}

// Layout para las páginas de autenticación (login y register)
export function AuthLayout({ children }: AuthLayoutProps) {
  const { isLoading } = useAuth();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Panel izquierdo con contenido */}
      <div className="flex flex-col">
        <div className="flex flex-col gap-4 p-8 md:p-12">
          <AuthHeader />
          
          {isLoading ? (
            <AuthLoading />
          ) : (
            <>
              {/* Contenido principal */}
              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-xs">
                  {children || <Outlet />}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Panel lateral derecho */}
      <AuthSidePanel />
    </div>
  );
}

