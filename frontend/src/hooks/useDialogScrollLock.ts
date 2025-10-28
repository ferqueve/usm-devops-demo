import { useEffect, useRef } from 'react';

/**
 * Hook para prevenir layout shift cuando se abre un modal
 * Calcula y compensa el ancho del scrollbar
 */
export const useDialogScrollLock = (isOpen: boolean) => {
  const scrollbarWidthRef = useRef<number>(0);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    // Guardar la posición actual del scroll
    scrollPositionRef.current = window.scrollY;

    // Calcular el ancho del scrollbar
    const getScrollbarWidth = () => {
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'scroll';
      // @ts-ignore - Propiedad específica de IE que puede estar presente
      if ('msOverflowStyle' in outer.style) {
        (outer.style as any).msOverflowStyle = 'scrollbar';
      }
      document.body.appendChild(outer);

      const inner = document.createElement('div');
      outer.appendChild(inner);

      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

      outer.parentNode?.removeChild(outer);

      return scrollbarWidth;
    };

    scrollbarWidthRef.current = getScrollbarWidth();

    // Aplicar estilos preventivos
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'relative';
    
    // Bloquear el body
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPositionRef.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Compensar por el scrollbar
    if (scrollbarWidthRef.current > 0) {
      const content = document.querySelector('[data-slot="dialog-content"]');
      if (content instanceof HTMLElement) {
        const currentRight = window.getComputedStyle(content).marginRight;
        const marginRightNum = parseInt(currentRight) || 0;
        content.style.marginRight = `${marginRightNum + scrollbarWidthRef.current}px`;
      }
    }

    return () => {
      // Restaurar estilos
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      // Restaurar scroll position
      window.scrollTo(0, scrollPositionRef.current);

      // Restaurar margin del dialog
      const content = document.querySelector('[data-slot="dialog-content"]');
      if (content instanceof HTMLElement) {
        content.style.marginRight = '';
      }
    };
  }, [isOpen]);
};

