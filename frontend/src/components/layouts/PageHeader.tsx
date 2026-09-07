import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
    <div className="flex min-w-0 items-stretch gap-2.5">
      <span
        className="w-1 shrink-0 self-stretch rounded-sm"
        style={{ backgroundColor: accentColor }}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-sm font-semibold leading-5 tracking-tight text-white">
            {title}
          </h1>
          {count !== undefined && (
            <span className="shrink-0 text-xs leading-5 text-white/60 tabular-nums">{count}</span>
          )}
        </div>
        <span className="mt-0.5 block truncate text-xs leading-4 text-white/45">
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
