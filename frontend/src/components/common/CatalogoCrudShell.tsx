import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import PermissionGuard from '@/components/auth/PermissionGuard';
import type { Permission } from '@/lib/config/permissions';

export interface CatalogoItem {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

/** Filas por página por defecto. Los catálogos son cortos: entran sin scroll. */
const DEFAULT_PAGE_SIZE = 6;
/** Debajo de esto el buscador estorba más de lo que ayuda. */
const SEARCH_THRESHOLD = 8;

interface CatalogoCrudShellProps<T extends CatalogoItem> {
  title: string;
  description: string;
  /** Ícono del catálogo: encabeza las filas sin swatch propio y el estado vacío. */
  Icon: React.ComponentType<{ className?: string }>;
  /** Hex de acento institucional UTEC para la barra del header (#184897, #F6CA21, …). */
  accentColor?: string;
  loading: boolean;
  items: T[];
  emptyLabel: string;
  /** Reemplaza el ícono de la sección al principio de la fila (un swatch de color, por ejemplo). */
  renderRowLeading?: (item: T) => React.ReactNode;
  /** Detalle extra a la derecha del nombre (el código de una carrera, por ejemplo). */
  renderRowMeta?: (item: T) => React.ReactNode;
  createLabel: string;
  /** 2 reparte las filas en dos columnas: para una tarjeta a todo el ancho. */
  columns?: 1 | 2;
  pageSize?: number;
  onCreate: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  permissions?: {
    crear?: Permission;
    editar?: Permission;
    eliminar?: Permission;
  };
}

/**
 * Sección de Configuración para un catálogo: lista compacta con buscador,
 * paginado y acciones por fila.
 *
 * La lista es densa a propósito. Un catálogo se lee de un vistazo para
 * encontrar un nombre; darle a cada tipo una tarjeta con borde propio ocupaba
 * media pantalla para mostrar cinco palabras.
 */
export function CatalogoCrudShell<T extends CatalogoItem>({
  title,
  description,
  Icon,
  accentColor = '#F6CA21',
  loading,
  items,
  emptyLabel,
  renderRowLeading,
  renderRowMeta,
  createLabel,
  columns = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  onCreate,
  onEdit,
  onDelete,
  permissions,
}: Readonly<CatalogoCrudShellProps<T>>) {
  const crearPerm = permissions?.crear ?? 'tipo:crear';
  const editarPerm = permissions?.editar ?? 'tipo:editar';
  const eliminarPerm = permissions?.eliminar ?? 'tipo:eliminar';

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.nombre.toLowerCase().includes(q) ||
        item.descripcion?.toLowerCase().includes(q)
    );
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Al filtrar, la página en la que estabas puede dejar de existir.
  const currentPage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(0);
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
              <div className="h-3.5 w-40 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="px-4 py-10 text-center">
          <Icon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nada coincide con «{query}»
          </p>
        </div>
      );
    }

    // En dos columnas los bordes no pueden salir de divide-y: cada fila se
    // dibuja el suyo, y la de la izquierda suma el separador vertical.
    const rowsClassName =
      columns === 2
        ? 'grid sm:grid-cols-2 [&>*]:border-b sm:[&>*:nth-child(odd)]:border-r'
        : 'divide-y divide-border';

    return (
      <div className={rowsClassName}>
        {visible.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
          >
            <span className="flex-shrink-0">
              {renderRowLeading?.(item) ?? (
                <Icon className="h-4 w-4 text-muted-foreground" />
              )}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{item.nombre}</span>
                {renderRowMeta?.(item)}
                {item.activo === false && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Inactivo
                  </Badge>
                )}
              </div>
              {item.descripcion && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.descripcion}
                </p>
              )}
            </div>

            {/* Atenuadas hasta que la fila importa; focus-within las trae de vuelta
                para quien navega con teclado. */}
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <PermissionGuard requiredPermission={editarPerm}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(item)}
                  aria-label={`Editar ${item.nombre}`}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </PermissionGuard>
              <PermissionGuard requiredPermission={eliminarPerm}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(item)}
                  aria-label={`Eliminar ${item.nombre}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </PermissionGuard>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    // flex-col + la lista en flex-1: puesta en una grilla, la tarjeta corta se
    // estira hasta el alto de la otra y el sobrante se lo come la lista, en vez
    // de quedar un hueco entre la tarjeta y el borde. Suelta, mantiene su alto.
    <section className="flex flex-col rounded-xl border bg-card text-card-foreground shadow-card overflow-hidden">
      {/* Mismo header que los paneles del dashboard: fondo institucional, barra
          de acento y la acción como botón sutil sobre el oscuro. */}
      <header className="flex items-start justify-between gap-3 bg-utec-dark px-4 py-3 text-white">
        {/* Envuelve en vez de truncar: si la descripción no entra al lado del
            título, baja entera a una segunda línea. */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
          <span
            className="w-1 h-4 rounded-sm shrink-0"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
          <h2 className="shrink-0 text-sm font-semibold tracking-tight whitespace-nowrap">{title}</h2>
          {!loading && (
            <span className="shrink-0 text-xs text-white/60 tabular-nums">{items.length}</span>
          )}
          <span className="text-xs text-white/40">· {description}</span>
        </div>

        <PermissionGuard requiredPermission={crearPerm}>
          <button
            type="button"
            onClick={onCreate}
            className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            {createLabel}
          </button>
        </PermissionGuard>
      </header>

      {items.length > SEARCH_THRESHOLD && !loading && (
        <div className="border-b px-4 py-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={`Buscar en ${title.toLowerCase()}...`}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex-1">{renderBody()}</div>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between border-t px-4 py-2.5">
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentPage * pageSize + 1}–{currentPage * pageSize + visible.length} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 0}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums px-1">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
