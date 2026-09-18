import { memo } from 'react';
import { useSidebar } from "@/components/ui/sidebar-context";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HeaderNodeNetwork } from "./HeaderNodeNetwork";
import { PAGE_ACTIONS_SLOT, PAGE_HEADER_SLOT } from "@/components/layouts/PageHeader";
import { MARCA } from '@/lib/design/paleta';

interface DashboardHeaderProps {
  title?: string;
  /** Las pantallas que ya llevan PageHeader ocultan el título de acá: uno solo por pantalla. */
  hideTitle?: boolean;
}

export const DashboardHeader = memo(function DashboardHeader({ 
  title = "Dashboard",
  hideTitle = false
}: DashboardHeaderProps) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <>
      {/* Esta barra es el header de la pantalla, no una franja decorativa: las
          pantallas con PageHeader le mandan su titulo, su bajada y sus acciones
          a los huecos de abajo. El fondo es el mismo utec-dark del sidebar. */}
      <header className="relative overflow-hidden flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-sidebar px-4 lg:px-6 shadow-sm">
        <HeaderNodeNetwork />
        <div className="relative z-10 flex min-w-0 items-center gap-4">
          {!hideTitle && (
            <div className="flex items-center gap-3 h-16">
              <h1 className="text-lg font-utec m-0 flex items-center h-full leading-none" style={{ color: '#d1d5db' }}>
                {title}
              </h1>
            </div>
          )}
          <div id={PAGE_HEADER_SLOT} className="flex min-w-0 items-center" />
        </div>

        <div id={PAGE_ACTIONS_SLOT} className="relative z-10 flex shrink-0 items-center" />
      </header>

      {/* Con el toggle adentro del sidebar, este flotante es la unica forma de
          volver a abrirlo cuando esta cerrado. */}
      {!open && (
        <Button
          onClick={toggleSidebar}
          className="fixed top-6 left-6 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          style={{ 
            backgroundColor: MARCA.oscuro,
            color: '#d1d5db',
            border: 'none'
          }}
          size="icon"
          aria-label="Abrir barra lateral"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
    </>
  );
});

