import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Dato al lado del título (la cantidad de items de la pantalla, por ejemplo). */
  count?: number | string;
  description: string;
  /** Hex de acento institucional UTEC (#184897, #F6CA21, #9333ea, …). */
  accentColor?: string;
  /** Acciones de la pantalla, alineadas a la derecha. */
  actions?: ReactNode;
  /** Navegación entre vistas de la pantalla (segmented, tabs). Va bajo el header. */
  nav?: ReactNode;
}

/**
 * Encabezado de pantalla. Misma estructura que el header de los catálogos de
 * Configuración, subida a nivel de página: barra de acento, título con su
 * cuenta, bajada debajo y las acciones siempre a la derecha.
 *
 * La idea es que todas las pantallas midan lo mismo acá arriba, para que el
 * contenido no salte al navegar entre ellas.
 */
export function PageHeader({
  title,
  count,
  description,
  accentColor = '#184897',
  actions,
  nav,
}: Readonly<PageHeaderProps>) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 bg-utec-dark px-4 py-2.5 text-white">
        <div className="flex min-w-0 items-stretch gap-2.5">
          <span
            className="w-1 shrink-0 self-stretch rounded-sm"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold leading-5 tracking-tight">{title}</h1>
              {count !== undefined && (
                <span className="shrink-0 text-xs leading-5 text-white/60 tabular-nums">{count}</span>
              )}
            </div>
            <span className="mt-0.5 block truncate text-xs leading-4 text-white/40">
              {description}
            </span>
          </div>
        </div>

        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>

      {nav && <div className="flex flex-wrap items-center gap-2 px-4 py-2">{nav}</div>}
    </div>
  );
}
