import { useState, useEffect } from 'react';

/**
 * Hook para detectar transiciones del sidebar y pausar animaciones pesadas
 * Esto mejora el rendimiento durante las animaciones del sidebar
 */
export const useSidebarTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    let transitionTimeout: NodeJS.Timeout;

    const handleSidebarInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Solo detectar interacciones con elementos del sidebar o botones de menú
      const isSidebarElement = target.closest('[data-sidebar]') || 
                              target.closest('[data-slot="sidebar"]') ||
                              target.closest('[data-slot="sidebar-trigger"]') ||
                              target.closest('.sidebar-menu-item') ||
                              target.closest('[data-sidebar="trigger"]');

      if (isSidebarElement) {
        setIsTransitioning(true);
        
        // Limpiar timeout anterior
        if (transitionTimeout) {
          clearTimeout(transitionTimeout);
        }
        
        // Pausar por 250ms (duración de transición del sidebar + margen)
        transitionTimeout = setTimeout(() => {
          setIsTransitioning(false);
        }, 250);
      }
    };

    // Detectar interacciones específicas del sidebar
    document.addEventListener('click', handleSidebarInteraction, true);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleSidebarInteraction, true);
      if (transitionTimeout) {
        clearTimeout(transitionTimeout);
      }
    };
  }, []);

  return {
    isTransitioning
  };
};
