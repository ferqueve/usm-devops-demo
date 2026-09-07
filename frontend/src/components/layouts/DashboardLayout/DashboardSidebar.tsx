import { useCallback, useMemo, memo, useState } from 'react';
import {
  Sidebar,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogOut, User, Settings } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { sidebarMenuItems, sidebarSections, canAccessSidebarItem, ROLE_LABELS } from "@/lib/config/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { formatEmailForDisplay, formatNameForSidebar } from "@/lib/utils/text-formatters";
import type { SidebarMenuItem as SidebarMenuItemType } from "@/lib/types/ui";
import PreferencesModal from "@/components/preferences/PreferencesModal";

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
  const [preferencesOpen, setPreferencesOpen] = useState(false);

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

  // Marca activo un ítem del menú. Varias rutas hijas no tienen ítem propio y
  // deben iluminar el ítem padre.
  const isItemActive = useCallback((item: SidebarMenuItemType) => {
    // Espacios: activo en /rooms y en el detalle /rooms/:id. Inventario ya no
    // cuelga de aca: tiene su propio item en el sidebar.
    if (item.id === 'rooms') {
      return location.pathname === '/rooms' ||
             location.pathname.startsWith('/rooms/');
    }

    // Materias queda activo en su detalle /materias/:id y también en el de una
    // tutoría, que ya no tiene ítem propio: vive como pestaña dentro de Materias.
    if (item.id === 'materias') {
      return location.pathname === '/materias' ||
             location.pathname.startsWith('/materias/') ||
             location.pathname === '/tutorias' ||
             location.pathname.startsWith('/tutorias/');
    }

    // Eventos activo también en el detalle /eventos/:id
    if (item.id === 'eventos') {
      return location.pathname === '/eventos' ||
             location.pathname.startsWith('/eventos/');
    }

    return location.pathname === item.href;
  }, [location.pathname]);

  // Agrupar los ítems visibles por sección, en el orden de sidebarSections.
  // Las secciones que quedan vacías tras el filtro por rol se descartan: así un
  // ESTUDIANTE nunca ve un título como "Administración" sin ítems debajo.
  const menuSections = useMemo(() =>
    sidebarSections
      .map((section) => ({
        ...section,
        items: filteredMenuItems.filter((item) => item.section === section.id),
      }))
      .filter((section) => section.items.length > 0)
  , [filteredMenuItems]);

  // Memoizar los grupos del menú para evitar re-renders
  const menuGroups = useMemo(() =>
    menuSections.map((section, index) => (
      <SidebarGroup
        key={section.id}
        className={`p-0 ${index === 0 ? '' : 'mt-5'}`}
      >
        {section.label && (
          <>
            {/* Hairline que se desvanece: separa sin rayar el panel oscuro */}
            <div className="mb-2 h-px bg-gradient-to-r from-white/10 to-transparent" />
            <SidebarGroupLabel className="h-auto px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
              {section.label}
            </SidebarGroupLabel>
          </>
        )}
        <SidebarGroupContent>
          <SidebarMenu className="bg-utec-dark gap-0.5 shrink-0">
            {section.items.map((item) => {
              const isActive = isItemActive(item);

              return (
                <SidebarMenuItem key={item.id} className="shrink-0">
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    onClick={() => handleMenuItemClick(item)}
                    className={`sidebar-menu-item transition-smooth h-9 shrink-0 ${isActive ? 'active active-indicator' : ''}`}
                  >
                    <Link to={item.href || "#"} className="flex items-center gap-3 relative">
                      <item.icon className={`size-4 transition-transform ${isActive ? 'scale-110' : 'hover-scale'}`} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )), [menuSections, isItemActive, handleMenuItemClick]);

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
            <span className="text-lg font-utec tracking-wider">USM</span>
          </Link>
        </div>
      </SidebarHeader>
      
      {/* Menú scrollable con la ScrollArea de shadcn (en vez del scroll nativo).
          flex-1 min-h-0 acota la altura para que el viewport interno scrollee.
          El thumb se aclara para que se vea sobre el fondo oscuro. */}
      <ScrollArea className="flex-1 min-h-0 bg-utec-dark [&_[data-slot=scroll-area-thumb]]:bg-white/25">
        <div className="bg-utec-dark pt-6 pb-2 px-1 pr-2.5">
          {menuGroups}
        </div>
      </ScrollArea>

      {/* Perfil del usuario: fijo (fuera del área scrollable). shrink-0 para que
          no se comprima cuando la pantalla es baja; solo el menú hace scroll. */}
      {user && (
        <div className="bg-utec-dark px-1 py-4 shrink-0 border-t border-white/10">
          <SidebarMenu className="bg-utec-dark">
            <SidebarMenuItem>
              <div className="flex flex-col gap-1 px-1 py-2">
                {/* Fila superior: Ícono, Rol y Configuración */}
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
                  
                  {/* Ícono de configuración a la derecha */}
                  <button
                    onClick={() => setPreferencesOpen(true)}
                    className="ml-auto flex-shrink-0 p-1.5 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    title="Preferencias"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
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

      <SidebarFooter className="border-t border-white/10 bg-utec-dark px-1 py-4 shrink-0">
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
      
      <PreferencesModal open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </Sidebar>
  );
});

