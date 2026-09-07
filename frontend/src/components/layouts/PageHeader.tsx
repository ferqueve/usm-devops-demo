import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Clases de las acciones que van en la barra oscura. Se exportan para que todas
 * las pantallas usen las mismas y no cada una su interpretacion.
 *
 * El primario usa bg-[#ffffff] y no bg-white a proposito: index.css remapea
 * `.dark .bg-white` al color de card, asi que en tema oscuro el boton blanco se
 * volvia una plancha gris con el texto oscuro encima.
 */
export const HEADER_ACTION = 'h-8 px-2.5 text-xs font-medium text-white/75 hover:bg-white/10 hover:text-white';
export const HEADER_ACTION_ICON = 'h-8 w-8 text-white/75 hover:bg-white/10 hover:text-white';
export const HEADER_PRIMARY =
  'ml-1 h-8 bg-[#ffffff] px-3 text-xs font-semibold text-[#343a40] shadow-none hover:bg-[#e9eaec]';

/** Ids de los huecos que expone DashboardHeader en la barra superior. */
export const PAGE_HEADER_SLOT = 'page-header-slot';
export const PAGE_ACTIONS_SLOT = 'page-actions-slot';

interface PageHeaderProps {
  title: string;
  /** Dato al lado del título (la cantidad de items de la pantalla, por ejemplo). */
  count?: number | string;
  description: string;
  /** Hex de acento institucional UTEC (#184897, #F6CA21, #9333ea, …). */
  accentColor?: string;
  /** Acciones de la pantalla, a la derecha de la barra. */
  actions?: ReactNode;
  /** Navegación entre vistas de la pantalla (segmented, tabs). Va en el contenido. */
  nav?: ReactNode;
}

/**
 * Encabezado de pantalla. No dibuja una barra propia: se mete en la barra
 * superior, que pasa a ser el header de la página en vez de una franja
 * decorativa con el título repetido.
 *
 * Va por portal y no por contexto a propósito: las acciones son JSX que cambia
 * de identidad en cada render, y guardarlas en un estado global obliga a
 * sincronizar en cada vuelta. Con el portal, el header se re-renderiza junto
 * con su pantalla y se desmonta con ella.
 */
export function PageHeader({
  title,
  count,
  description,
  accentColor = '#184897',
  actions,
  nav,
}: Readonly<PageHeaderProps>) {
  const [slots, setSlots] = useState<{ head: HTMLElement | null; actions: HTMLElement | null }>({
    head: null,
    actions: null,
  });

  // Los huecos los pinta DashboardHeader, que ya está montado cuando la
  // pantalla corre sus efectos.
  useEffect(() => {
    setSlots({
      head: document.getElementById(PAGE_HEADER_SLOT),
      actions: document.getElementById(PAGE_ACTIONS_SLOT),
    });
  }, []);

  const heading = (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="h-6 w-1 shrink-0 rounded-sm"
        style={{ backgroundColor: accentColor }}
        aria-hidden
      />
      <div className="min-w-0">
        {/* m-0 en el h1: la hoja base le pone margin-bottom 7px a los headings
            y eso separaba la bajada. El recorte va en la fila y no en el h1
            porque un elemento con overflow hidden alinea por su borde inferior
            en vez de por su linea de base. */}
        <div className="flex min-w-0 items-baseline gap-1.5 overflow-hidden leading-[1.15]">
          <h1 className="m-0 whitespace-nowrap text-sm font-semibold leading-[1.15] tracking-tight text-white">
            {title}
          </h1>
          {count !== undefined && (
            <span className="shrink-0 text-xs leading-[1.15] text-white/55 tabular-nums">{count}</span>
          )}
        </div>
        <span className="block truncate text-xs leading-[1.15] text-white/45">
          {description}
        </span>
      </div>
    </div>
  );

  return (
    <>
      {slots.head && createPortal(heading, slots.head)}
      {slots.actions && actions && createPortal(
        <div className="flex items-center gap-1">{actions}</div>,
        slots.actions
      )}
      {nav && <div className="flex flex-wrap items-center gap-2">{nav}</div>}
    </>
  );
}
