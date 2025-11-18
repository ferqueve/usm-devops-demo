import { useCallback, useMemo, memo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogOut, User } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { sidebarMenuItems, canAccessSidebarItem, ROLE_LABELS } from "@/lib/config/constants";
import { useAuth } from "@/hooks/useAuth";
import { formatEmailForDisplay, formatNameForSidebar } from "@/lib/utils/text-formatters";
import type { SidebarMenuItem as SidebarMenuItemType } from "@/lib/types/ui";

// Tipos para las props del sidebar
interface DashboardSidebarProps {
  onLogout?: () => void;
  onMenuItemClick?: (item: SidebarMenuItemType) => void;
}

// Componente del sidebar del dashboard
export const DashboardSidebar = memo(function DashboardSidebar({ onLogout, onMenuItemClick }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Memoizar el handler de click para evitar re-renders innecesarios
  const handleMenuItemClick = useCallback((item: SidebarMenuItemType) => {
    if (item.href) {
      navigate(item.href);
    }
    onMenuItemClick?.(item);
  }, [navigate, onMenuItemClick]);

  // Memoizar el handler de logout
  const handleLogout = useCallback(() => {
    onLogout?.();
  }, [onLogout]);

  // Filtrar items del menú según el rol del usuario
  const filteredMenuItems = useMemo(() => {
    if (!user?.rol) return [];
    
    return sidebarMenuItems.filter(item => 
      canAccessSidebarItem(user.rol, item.id)
    );
  }, [user?.rol]);

  // Memoizar los items del menú para evitar re-renders
  const menuItems = useMemo(() => 
    filteredMenuItems.map((item) => {
      let isActive = location.pathname === item.href;
      
      // Lógica especial para Espacios: debe estar activo en /rooms, /rooms/:id e /inventory
      if (item.id === 'rooms') {
        isActive = location.pathname === '/rooms' || 
                   location.pathname.startsWith('/rooms/') || 
                   location.pathname === '/inventory';
      }
      
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton 
            asChild 
            isActive={isActive}
            onClick={() => handleMenuItemClick(item)}
            className={`sidebar-menu-item transition-smooth ${isActive ? 'active active-indicator' : ''}`}
          >
            <Link to={item.href || "#"} className="flex items-center gap-3 relative">
              <item.icon className={`size-4 transition-transform ${isActive ? 'scale-110' : 'hover-scale'}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }), [filteredMenuItems, location.pathname, handleMenuItemClick]);

  return (
    <Sidebar variant="inset" className="bg-utec-dark shadow-inner-subtle">
      <SidebarHeader className="h-16 border-b border-white/10 bg-utec-dark px-4">
        <div className="flex items-center justify-between gap-3 w-full h-full">
          {/* Logo UTEC a la izquierda */}
          <Link to="/dashboard" className="flex items-center hover:opacity-80 transition-all hover:scale-105 -mt-2">
            <img 
              src="/utec-logo-header.svg" 
              alt="UTEC Logo" 
              className="h-12 w-auto"
            />
          </Link>
          
          {/* Separador vertical con gradiente sutil */}
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
          
          {/* USM a la derecha */}
          <Link to="/dashboard" className="flex items-center sidebar-menu-item px-3 py-1.5 rounded-md transition-all hover:scale-105">
            <span className="text-lg font-utec-brand tracking-wider">USM</span>
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="pt-6 bg-utec-dark px-1">
        <SidebarMenu className="bg-utec-dark space-y-1">
          {menuItems}
        </SidebarMenu>
      </SidebarContent>
      
      {/* Perfil del usuario */}
      {user && (
        <div className="bg-utec-dark px-1 py-4">
          <SidebarMenu className="bg-utec-dark">
            <SidebarMenuItem>
              <div className="flex flex-col gap-1 px-1 py-2">
                {/* Fila superior: Ícono y Rol */}
                <div className="flex items-center gap-1">
                  {/* Avatar circular más pequeño */}
                  <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-utec-blue to-utec-purple rounded-full flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  
                  {/* Rol como badge */}
                  <div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
                      {ROLE_LABELS[user.rol as keyof typeof ROLE_LABELS] || user.rol}
                    </span>
                  </div>
                </div>
                
                {/* Información del usuario */}
                <div className="flex-1 min-w-0 text-left">
                  {/* Nombre con salto de línea inteligente */}
                  <div className="text-sm font-semibold text-white break-words mb-0.5 leading-tight" title={user?.nombre || ""}>
                    {(() => {
                      const nameFormat = formatNameForSidebar(user?.nombre || "");
                      if (nameFormat.needsBreak) {
                        return (
                          <>
                            {nameFormat.firstLine}
                            <br />
                            {nameFormat.secondLine}
                          </>
                        );
                      }
                      return nameFormat.firstLine;
                    })()}
                  </div>
                  
                  {/* Email con salto de línea inteligente */}
                  <div className="text-xs text-gray-400 leading-tight" title={user?.email || ""}>
                    {(() => {
                      const emailFormat = formatEmailForDisplay(user?.email || "", 20);
                      if (emailFormat.needsBreak) {
                        return (
                          <>
                            {emailFormat.firstLine}
                            <br />
                            {emailFormat.secondLine}
                          </>
                        );
                      }
                      return emailFormat.firstLine;
                    })()}
                  </div>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      )}
      
      <SidebarFooter className="border-t border-white/10 bg-utec-dark px-1 py-4">
        <SidebarMenu className="bg-utec-dark">
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              className="sidebar-menu-item transition-smooth hover:bg-utec-red/20 hover:text-utec-red"
            >
              <LogOut className="size-4 transition-transform hover-scale" />
              <span className="font-medium">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
});

