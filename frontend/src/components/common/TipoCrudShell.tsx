import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import PermissionGuard from '@/components/auth/PermissionGuard';
import type { Permission } from '@/lib/config/permissions';

export interface TipoCrudItem {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

interface TipoCrudShellProps<T extends TipoCrudItem> {
  /** Solo aplica en variant="dialog". */
  open?: boolean;
  /** Solo aplica en variant="dialog". */
  onOpenChange?: (open: boolean) => void;
  /** "dialog" abre el CRUD sobre otra pantalla; "inline" lo monta como sección de una página. */
  variant?: 'dialog' | 'inline';
  title: string;
  description: string;
  loading: boolean;
  items: T[];
  loadingLabel: string;
  emptyLabel: string;
  EmptyIcon: React.ComponentType<{ className?: string }>;
  /** Renders the leading icon/swatch for an item row. */
  renderRowLeading: (item: T) => React.ReactNode;
  /** Renders extra detail under the item name (a code badge, for instance). */
  renderRowMeta?: (item: T) => React.ReactNode;
  createLabel?: string;
  onCreate: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  /** Permission tags. */
  permissions?: {
    crear?: Permission;
    editar?: Permission;
    eliminar?: Permission;
  };
}

/**
 * Generic management surface used by TipoElementoManagement and
 * TipoEspacioManagement. Renders a list of "tipo" items with edit/delete
 * actions, an empty state, and un botón de "Crear".
 *
 * Sirve las dos formas en que se usa un catálogo: como diálogo desde la
 * pantalla que lo consume, o inline como sección de Configuración.
 */
export function TipoCrudShell<T extends TipoCrudItem>({
  open,
  onOpenChange,
  variant = 'dialog',
  title,
  description,
  loading,
  items,
  loadingLabel,
  emptyLabel,
  EmptyIcon,
  renderRowLeading,
  renderRowMeta,
  createLabel = 'Crear Tipo',
  onCreate,
  onEdit,
  onDelete,
  permissions,
}: Readonly<TipoCrudShellProps<T>>) {
  const crearPerm = permissions?.crear ?? 'tipo:crear';
  const editarPerm = permissions?.editar ?? 'tipo:editar';
  const eliminarPerm = permissions?.eliminar ?? 'tipo:eliminar';

  const createButton = (
    <PermissionGuard requiredPermission={crearPerm}>
      <Button onClick={onCreate}>
        <Plus className="h-4 w-4 mr-2" />
        {createLabel}
      </Button>
    </PermissionGuard>
  );

  const list = (() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{loadingLabel}</p>
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <EmptyIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyLabel}</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {items.map((tipo) => (
          <div
            key={tipo.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {renderRowLeading(tipo)}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{tipo.nombre}</h3>
                {tipo.descripcion && (
                  <p className="text-xs text-muted-foreground truncate">
                    {tipo.descripcion}
                  </p>
                )}
                {renderRowMeta?.(tipo)}
              </div>
              {tipo.activo === false && (
                <Badge variant="secondary" className="text-xs">
                  Inactivo
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <PermissionGuard requiredPermission={editarPerm}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(tipo)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              <PermissionGuard requiredPermission={eliminarPerm}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(tipo)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </PermissionGuard>
            </div>
          </div>
        ))}
      </div>
    );
  })();

  // Inline: el botón de crear sube al header de la tarjeta (no hay footer que
  // cerrar, la sección es la pantalla).
  if (variant === 'inline') {
    return (
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {createButton}
        </CardHeader>
        <CardContent>{list}</CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">{list}</div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cerrar
          </Button>
          {createButton}
        </div>
      </DialogContent>
    </Dialog>
  );
}
