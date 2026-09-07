import { memo, useRef, useState, useEffect } from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar-context";
import { Clock, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeaderNodeNetwork } from "./HeaderNodeNetwork";

interface DashboardHeaderProps {
  title?: string;
  /** Las pantallas que ya llevan PageHeader ocultan el título de acá: uno solo por pantalla. */
  hideTitle?: boolean;
}

export const DashboardHeader = memo(function DashboardHeader({ 
  title = "Dashboard",
  hideTitle = false
}: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTriggerVisible, setIsTriggerVisible] = useState(true);
  const triggerWrapperRef = useRef<HTMLDivElement>(null);
  const { toggleSidebar, state, open } = useSidebar();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, []);

  // Detectar si el botón del header está visible
  useEffect(() => {
    const triggerWrapper = triggerWrapperRef.current;
    if (!triggerWrapper) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsTriggerVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      }
    );

    observer.observe(triggerWrapper);

    return () => {
      observer.disconnect();
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-UY', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <>
      <header className="relative overflow-hidden flex h-16 items-center justify-between gap-4 border-b px-4 lg:px-6 shadow-sm" style={{ backgroundColor: '#525961' }}>
        <HeaderNodeNetwork />
        <div className="relative z-10 flex items-center gap-4">
          <div ref={triggerWrapperRef}>
            <SidebarTrigger 
              style={{ color: '#d1d5db' }} 
              className="hover:bg-white/10 transition-all hover:scale-105 rounded-md p-2" 
            />
          </div>
          {!hideTitle && (
            <>
              <div className="h-6 w-px bg-white/20"></div>
              <div className="flex items-center gap-3 h-16">
                <h1 className="text-lg font-utec m-0 flex items-center h-full leading-none" style={{ color: '#d1d5db' }}>
                  {title}
                </h1>
              </div>
            </>
          )}
        </div>

        <div className="relative z-10 flex items-center gap-2">
          {/* Toggle de tema claro/oscuro */}
          <ThemeToggle />
          {/* Badge con hora actual */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
            <Clock className="h-4 w-4" style={{ color: '#d1d5db' }} />
            <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </header>

      {/* Hamburger flotante que aparece cuando el botón del header no está visible.
          Solo se muestra cuando el sidebar está colapsado: con el sidebar abierto el rail
          interno alcanza para cerrarlo y este botón pisaba el contenido a la derecha. */}
      {!isTriggerVisible && !(state === 'expanded' && open) && (
        <Button
          onClick={toggleSidebar}
          className="fixed top-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          style={{ 
            backgroundColor: '#525961',
            color: '#d1d5db',
            border: 'none'
          }}
          size="icon"
          aria-label="Alternar barra lateral"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}
    </>
  );
});

