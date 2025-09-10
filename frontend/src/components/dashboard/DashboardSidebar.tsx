import React, { useCallback, useMemo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Building2, LogOut } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { sidebarMenuItems } from "@/lib/config/navigation";
import { canAccessSidebarItem } from "@/lib/config/roles";
import { useAuth } from "@/contexts/AuthContext";
import type { SidebarMenuItem as SidebarMenuItemType } from "@/lib/types/dashboard";

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
    filteredMenuItems.map((item) => (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton 
          asChild 
          isActive={location.pathname === item.href}
          onClick={() => handleMenuItemClick(item)}
        >
          <Link to={item.href || "#"}>
            <item.icon className="size-4" />
            {item.label}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )), [filteredMenuItems, location.pathname, handleMenuItemClick]);

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/dashboard" className="flex items-center gap-2">
                <Building2 className="size-4" />
                <span className="text-base font-semibold">UTEC Space Manager</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="size-4" />
              Cerrar Sesión
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
