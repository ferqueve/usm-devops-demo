import { useCallback, useMemo, memo, useState } from 'react';
import {
  Sidebar,
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, LogOut, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { sidebarMenuItems, sidebarSections, canAccessSidebarItem, ROLE_LABELS } from "@/lib/config/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import type { SidebarMenuItem as SidebarMenuItemType, SidebarSubItem } from "@/lib/types/ui";
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
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  // Iniciales del usuario: identifican mejor que un icono de persona generico.
  const initials = useMemo(() => {
    const palabras = (user?.nombre || '').trim().split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return '·';
    return palabras.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }, [user?.nombre]);

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

  // Una vista está activa si su URL coincide con la actual. La primera vista de
  // cada ítem cubre además la ruta pelada, que es la que se abre por defecto.
  const isSubItemActive = useCallback((item: SidebarMenuItemType, sub: SidebarSubItem) => {
    const actual = `${location.pathname}${location.search}`;
    if (actual === sub.href) return true;
    return location.pathname === item.href && !location.search && item.children?.[0]?.id === sub.id;
  }, [location.pathname, location.search]);

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

              const boton = (
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
              );

              if (!item.children?.length) {
                return (
                  <SidebarMenuItem key={item.id} className="shrink-0">
                    {boton}
                  </SidebarMenuItem>
                );
              }

              // El ítem sigue navegando a su pantalla; el chevron abre las vistas.
              return (
                <Collapsible key={item.id} asChild defaultOpen={isActive}>
                  <SidebarMenuItem className="shrink-0">
                    {boton}
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction
                        className="top-1.5 text-white/40 transition-transform hover:bg-white/10 hover:text-white data-[state=open]:rotate-90"
                        aria-label={`Ver las vistas de ${item.label}`}
                      >
                        <ChevronRight className="size-4" />
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="mr-0 border-white/10 pr-0">
                        {item.children.map((sub) => {
                          const subActivo = isSubItemActive(item, sub);
                          return (
                            <SidebarMenuSubItem key={sub.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={subActivo}
                                className={`h-8 text-white/60 hover:bg-white/10 hover:text-white ${subActivo ? 'bg-white/10 text-white' : ''}`}
                              >
                                <Link to={sub.href} className="flex items-center gap-2.5">
                                  <sub.icon className="size-3.5" />
                                  <span>{sub.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )), [menuSections, isItemActive, isSubItemActive, handleMenuItemClick]);

  return (
    <Sidebar variant="inset" className="bg-utec-dark shadow-inner-subtle">
      {/* Un solo lockup: el logo y USM son un unico link, con la bajada diciendo
          que es la app. El toggle vive aca, con lo que controla, y no del lado
          de la pagina. */}
      <SidebarHeader className="h-16 border-b border-white/10 bg-utec-dark px-3">
        <div className="flex h-full w-full items-center justify-between gap-2">
          <Link
            to="/dashboard"
            className="flex min-w-0 items-center gap-2.5 rounded-md px-1 py-1 transition-colors hover:bg-white/5"
          >
            <img src="/utec-isotipo.svg" alt="UTEC" className="h-7 w-7 shrink-0" />
            <span className="min-w-0">
              <span className="block font-utec text-base leading-none tracking-[0.14em] text-white">
                USM
              </span>
              <span className="mt-1 block whitespace-nowrap text-[8px] uppercase leading-none tracking-[0.14em] text-white/35">
                Space Manager
              </span>
            </span>
          </Link>

          <SidebarTrigger className="shrink-0 text-white/70 transition-colors hover:bg-white/10 hover:text-white" />
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

      {/* Perfil: una sola pieza. Identidad arriba y las tres acciones de la
          cuenta abajo, en partes iguales; salir se distingue por el color. */}
      {user && (
        <SidebarFooter className="shrink-0 border-t border-white/10 bg-utec-dark p-2">
          <div className="overflow-hidden rounded-lg bg-white/[0.06]">
            <div className="flex items-center gap-2.5 p-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/10">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold leading-tight text-white" title={user.nombre}>
                  {user.nombre}
                </div>
                <div className="mt-0.5 truncate text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-white/35">
                  {ROLE_LABELS[user.rol as keyof typeof ROLE_LABELS] || user.rol}
                </div>
                <div className="mt-1 truncate text-[11px] leading-tight text-white/40" title={user.email}>
                  {user.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPreferencesOpen(true)}
                className="flex justify-center py-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                title="Preferencias"
                aria-label="Preferencias"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex justify-center border-l border-white/10 py-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                title={isDark ? 'Tema claro' : 'Tema oscuro'}
                aria-label={isDark ? 'Tema claro' : 'Tema oscuro'}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex justify-center border-l border-white/10 py-2 text-utec-red/80 transition-colors hover:bg-utec-red/15 hover:text-utec-red"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </SidebarFooter>
      )}

      <PreferencesModal open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </Sidebar>
  );
});

