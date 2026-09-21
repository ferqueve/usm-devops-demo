import React, { useCallback, useMemo, memo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { AiChatWidget } from '@/components/ai/AiChatWidget';
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from 'react';

// Tipos para el layout
interface DashboardLayoutProps {
  children: ReactNode;
  title?: string; // Título opcional para sobrescribir el título automático
  /** La pantalla ya muestra su propio PageHeader: no repetir el título arriba. */
  hideTitle?: boolean;
  onLogout?: () => void;
}

// Layout reutilizable para todas las páginas del dashboard
export const DashboardLayout = memo(function DashboardLayout({ children, title, hideTitle, onLogout }: DashboardLayoutProps) {
  const location = useLocation();
  const { logout } = useAuth();

  // Memoizar la ruta actual para evitar recálculos innecesarios
  const currentRoute = useMemo(() => {
    const path = location.pathname.replace('/', '');
    return path || 'dashboard';
  }, [location.pathname]);

  // Memoizar el título de la página
  const pageTitle = useMemo(() => {
    // Si se pasa un título específico, usarlo
    if (title) {
      return title;
    }
    
    const path = location.pathname;
    
    // Detectar si estamos en detalles de espacio (/rooms/:id)
    if (path.startsWith('/rooms/') && path !== '/rooms') {
      // Para detalles de espacio, devolver texto genérico (el título específico se setea en el componente)
      return 'Espacios';
    }
    
    const titleMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'calendar': 'Calendario de Reservas',
      'reservations': 'Gestión de Reservas',
      'rooms': 'Gestión de Espacios',
      'statistics': 'Estadísticas y Reportes',
      'predicciones': 'Predicciones',
      'users': 'Gestión de Usuarios',
      'system': 'Sistema',
      'audit': 'Auditoría del Sistema',
      'inventory': 'Gestión de Inventario',
      'inventory/requests': 'Solicitudes de Inventario',
      'configuracion': 'Configuración',
    };
    return titleMap[currentRoute] || currentRoute.charAt(0).toUpperCase() + currentRoute.slice(1);
  }, [currentRoute, location.pathname, title]);

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
    /*
     * h-svh ancla el alto: sin el, ningun ancestro tiene alto definido, la
     * cadena de h-full no resuelve y el layout crece con el contenido. Es lo
     * que hacia que un dashboard con listas largas empujara la pagina.
     */
    <SidebarProvider style={sidebarStyles} className="h-svh overflow-hidden">
      <DashboardSidebar
        onLogout={handleLogout}
        onMenuItemClick={handleMenuItemClick}
      />
      <SidebarInset>
        <div className="flex flex-col h-full max-w-full overflow-hidden">
          <DashboardHeader title={pageTitle} hideTitle={hideTitle} />
          {/* Con el alto anclado, el scroll de cada pagina vive aca adentro.
              El pb-20 es el lugar del botón flotante del asistente: sin él tapaba
              lo último de cada pantalla —las acciones de la última fila de una
              tabla, el «Editar» de la última ficha—. En /asistente no hay botón. */}
          <main className={`flex-1 min-h-0 overflow-y-auto p-2 md:p-3 lg:p-4 bg-background page-dots flex flex-col ${
            location.pathname === '/asistente' ? '' : 'pb-20 md:pb-20 lg:pb-20'
          }`}>
            <div className="mx-auto max-w-[1920px] min-w-0 w-full px-0 flex-1 flex flex-col min-h-full">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
      {/* En /asistente el chat ya ocupa la pantalla: la burbuja sobraría. */}
      {location.pathname !== '/asistente' && <AiChatWidget />}
    </SidebarProvider>
  );
});

