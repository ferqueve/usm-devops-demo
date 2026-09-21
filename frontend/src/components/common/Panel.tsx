import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { MARCA } from '@/lib/design/paleta';

interface PanelProps {
  title: string;
  /** Icono a la izquierda del título, dentro del encabezado. */
  icon?: ReactNode;
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
  /** Centra el contenido en el alto del panel: donas, medidores. */
  centrar?: boolean;
  /** Estira el panel al alto de su fila, para que dos al lado coincidan. */
  altoCompleto?: boolean;
  /**
   * Controles extra a la derecha del encabezado, después del enlace.
   * `PanelEstadistica` mete acá su botón de ampliar.
   */
  acciones?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Un bloque con encabezado oscuro y barra de acento.
 *
 * Antes solo el panel del admin se veía así y las otras cinco pantallas
 * dejaban las listas flotando sobre el fondo punteado, sin contenedor: dos
 * diseños distintos para el mismo tipo de contenido.
 *
 * Y después había dos implementaciones del mismo encabezado: ésta y la de
 * `PanelEstadistica`, que sumaba el botón de ampliar. Mismo fondo, misma
 * barra, mismo enlace, distinto padding —`px-5 py-3` contra `px-4 py-2.5`—,
 * así que un panel de dashboard y uno de estadísticas no alineaban. Hoy el
 * encabezado se dibuja una sola vez y `PanelEstadistica` lo usa pasando su
 * botón por `acciones`.
 *
 * Y había cuatro copias más, iguales entre sí, en EventosManagement,
 * EventoDetail, MateriaDetail y TutoriaDetail: tarjeta `rounded-2xl` con
 * encabezado claro y un cuadradito de color con el icono. Las pantallas de
 * detalle no se parecían a los dashboards. Lo que aportaban —el icono— es
 * ahora el prop `icon`.
 *
 * El encabezado mide 44 px, igual que una fila de tabla.
 */
export function Panel({
  title,
  icon,
  count,
  action,
  accentColor = MARCA.amarillo,
  flush = false,
  scroll = false,
  centrar = false,
  altoCompleto = false,
  acciones,
  className,
  children,
}: Readonly<PanelProps>) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card ${
        altoCompleto ? 'h-full' : ''
      } ${className ?? ''}`}
    >
      <div className="flex items-center justify-between gap-3 bg-chrome px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="h-4 w-1 shrink-0 rounded-sm"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
          {icon && <span className="shrink-0 [&>svg]:size-4" aria-hidden>{icon}</span>}
          {/* El título puede acortarse; antes era shrink-0 y en una columna angosta
              se montaba encima de las acciones («Inscriptos · 15» pisado por
              «CSV»). El conteo cede primero. */}
          <h2 className="min-w-0 truncate text-sm font-semibold tracking-tight">{title}</h2>
          {count !== undefined && count !== '' && (
            <span className="min-w-0 shrink-[3] truncate text-xs tabular-nums text-white/60">{count}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {action && (
            <Link
              to={action.to}
              className="inline-flex items-center gap-0.5 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              {action.label}
              <ChevronRight className="size-3.5" />
            </Link>
          )}
          {acciones}
        </div>
      </div>
      <div
        className={`min-h-0 flex-1 ${scroll ? 'overflow-y-auto [scrollbar-width:thin]' : ''} ${
          flush ? '' : 'p-4'
        } ${centrar ? 'flex flex-col justify-center' : ''}`}
      >
        {children}
        {/* Con scroll, un degradé abajo avisa que hay más para ver. Lo tenía
            sólo el panel de estadísticas; no hay motivo para que el del
            dashboard corte el contenido sin avisar. */}
        {scroll && (
          <div
            className={`pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-card to-transparent ${
              flush ? '' : '-mx-4 -mb-4'
            }`}
            aria-hidden
          />
        )}
      </div>
    </section>
  );
}
