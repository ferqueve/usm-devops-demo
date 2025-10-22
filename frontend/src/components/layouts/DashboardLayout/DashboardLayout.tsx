import React, { useCallback, useMemo, memo } from 'react';
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
export const DashboardLayout = memo(function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  const location = useLocation();
  const { logout } = useAuth();

  // Memoizar la ruta actual para evitar recálculos innecesarios
  const currentRoute = useMemo(() => {
    const path = location.pathname.replace('/', '');
    return path || 'dashboard';
  }, [location.pathname]);

  // Memoizar el título de la página
  const pageTitle = useMemo(() => {
    const titleMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'calendar': 'Calendario de Reservas',
      'reservations': 'Gestión de Reservas',
      'rooms': 'Gestión de Salones',
      'statistics': 'Estadísticas y Reportes',
      'users': 'Gestión de Usuarios',
      'system': 'Sistema'
    };
    return titleMap[currentRoute] || currentRoute.charAt(0).toUpperCase() + currentRoute.slice(1);
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
        <div className="flex flex-col h-full max-w-full overflow-hidden">
          <DashboardHeader title={pageTitle} />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-gray-50">
            <div className="mx-auto max-w-[1920px] min-w-0 w-full px-0">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
});

