import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { MARCA } from '@/lib/design/paleta';

interface PanelProps {
  title: string;
  /** Dato al lado del título: un conteo, un detalle. */
  count?: string | number;
  /** Enlace de acción a la derecha del encabezado. */
  action?: { label: string; to: string };
  /** Hex de acento institucional UTEC (#184897, #F6CA21, …). */
  accentColor?: string;
  /** Quita el padding del cuerpo, para listas que dibujan sus propios bordes. */
  flush?: boolean;
  /**
   * El cuerpo scrollea por dentro en vez de estirar la tarjeta. Es lo que
   * mantiene el dashboard en una sola pantalla: la lista puede tener veinte
   * filas y el panel sigue midiendo lo mismo.
   */
  scroll?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Un bloque del dashboard: encabezado oscuro con barra de acento y el
 * contenido dentro de una tarjeta.
 *
 * Antes solo el panel del admin se veía así y las otras cinco pantallas
 * dejaban las listas flotando sobre el fondo punteado, sin contenedor: dos
 * diseños distintos para el mismo tipo de contenido.
 */
export function Panel({
  title,
  count,
  action,
  accentColor = MARCA.amarillo,
  flush = false,
  scroll = false,
  className,
  children,
}: Readonly<PanelProps>) {
  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-3 bg-chrome px-5 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="h-4 w-1 shrink-0 rounded-sm"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {count !== undefined && count !== '' && (
            <span className="truncate text-xs tabular-nums text-white/60">{count}</span>
          )}
        </div>
        {action && (
          <Link
            to={action.to}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            {action.label}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className={`min-h-0 flex-1 ${scroll ? 'overflow-y-auto' : ''} ${flush ? '' : 'p-3'}`}>{children}</div>
    </section>
  );
}
