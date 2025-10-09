import React, { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from 'react';

// Tipos para el layout
interface DashboardLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

// Layout reutilizable para todas las páginas del dashboard
export function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  const location = useLocation();
  const { logout } = useAuth();

  // Memoizar la ruta actual para evitar recálculos innecesarios
  const currentRoute = useMemo(() => {
    const path = location.pathname.replace('/', '');
    return path || 'dashboard';
  }, [location.pathname]);

  // Memoizar el título de la página
  const pageTitle = useMemo(() => {
    return currentRoute.charAt(0).toUpperCase() + currentRoute.slice(1);
  }, [currentRoute]);

  // Memoizar el handler de click del menú
  const handleMenuItemClick = useCallback(() => {
    // La navegación se maneja en el sidebar
  }, []);

  // Memoizar el handler de logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      onLogout?.();
    } catch (error) {
      console.error('Error durante el logout:', error);
    }
  }, [logout, onLogout]);

  // Memoizar los estilos del sidebar para evitar re-renders
  const sidebarStyles = useMemo(() => ({
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties), []);

  return (
    <SidebarProvider style={sidebarStyles}>
      <DashboardSidebar
        onLogout={handleLogout}
        onMenuItemClick={handleMenuItemClick}
      />
      <SidebarInset>
        <div className="flex flex-col h-full">
          <DashboardHeader title={pageTitle} />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

