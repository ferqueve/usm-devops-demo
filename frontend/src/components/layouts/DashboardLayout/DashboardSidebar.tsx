import { useCallback, useMemo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { sidebarMenuItems } from "@/core/config/navigation";
import { canAccessSidebarItem } from "@/core/config/roles";
import { useAuth } from "@/contexts/AuthContext";
import type { SidebarMenuItem as SidebarMenuItemType } from "@/core/types/types";

// Tipos para las props del sidebar
interface DashboardSidebarProps {
  onLogout?: () => void;
  onMenuItemClick?: (item: SidebarMenuItemType) => void;
}

// Componente del sidebar del dashboard
export function DashboardSidebar({ onLogout, onMenuItemClick }: DashboardSidebarProps) {
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
      const isActive = location.pathname === item.href;
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton 
            asChild 
            isActive={isActive}
            onClick={() => handleMenuItemClick(item)}
            className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
          >
            <Link to={item.href || "#"} className="flex items-center gap-2">
              <item.icon className="size-4" />
              {item.label}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }), [filteredMenuItems, location.pathname, handleMenuItemClick]);

  return (
    <Sidebar variant="inset" className="bg-utec-dark">
      <SidebarHeader className="h-16 border-b border-white/10 bg-utec-dark px-4">
        <div className="flex items-center justify-between gap-3 w-full h-full">
          {/* Logo UTEC a la izquierda */}
          <Link to="/dashboard" className="flex items-center hover:opacity-80 transition-opacity -mt-2">
            <img 
              src="/utec-logo-header.svg" 
              alt="UTEC Logo" 
              className="h-12 w-auto"
            />
          </Link>
          
          {/* Separador vertical */}
          <div className="h-6 w-px bg-white/20"></div>
          
          {/* USM a la derecha */}
          <Link to="/dashboard" className="flex items-center sidebar-menu-item px-3 py-1 rounded-md">
            <span className="text-lg font-utec-brand">USM</span>
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="pt-4 bg-utec-dark">
        <SidebarMenu className="bg-utec-dark">
          {menuItems}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-white/10 bg-utec-dark">
        <SidebarMenu className="bg-utec-dark">
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="sidebar-menu-item">
              <LogOut className="size-4" />
              Cerrar Sesión
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

