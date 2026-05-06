import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Package, Eye, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InventarioItem } from '@/lib/types/spaces';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { EstadoBadge } from './_shared/inventoryEstado';
import { EspacioCell } from './_shared/EspacioCell';

interface InventoryCardViewProps {
  items: InventarioItem[];
  onEdit: (item: InventarioItem) => void;
  onDelete: (item: InventarioItem) => void;
  onAssign: (item: InventarioItem) => void;
  onView?: (item: InventarioItem) => void;
  selectedItems?: Set<number>;
  onToggleSelect?: (id: number) => void;
}

export default function InventoryCardView({
  items,
  onEdit,
  onDelete,
  onAssign,
  onView,
  selectedItems,
  onToggleSelect,
}: Readonly<InventoryCardViewProps>) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-lg transition-shadow relative">
          {onToggleSelect && (
            <div className="absolute top-3 left-3 z-10">
              <Checkbox
                checked={selectedItems?.has(item.id)}
                onCheckedChange={() => onToggleSelect?.(item.id)}
              />
            </div>
          )}

          <CardContent className="p-4 pb-0">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="truncate">{item.tipoElementoNombre}</span>
                    <span className="text-muted-foreground text-sm font-normal">#{item.id}</span>
                  </h3>
                </div>
                <EstadoBadge estado={item.estado} />
              </div>

              {/* Información principal */}
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Cantidad</p>
                  <p className="font-semibold">{item.cantidad} unidad(es)</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t pt-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">Espacio:</span>{' '}
                  <EspacioCell item={item} variant="card" />
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                <PermissionGuard requiredPermission="inventario:asignar">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onAssign(item)}
                  >
                    <Package className="h-3 w-3 mr-1" />
                    {item.espacioId ? 'Reasignar' : 'Asignar'}
                  </Button>
                </PermissionGuard>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="px-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(item)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </DropdownMenuItem>
                    )}
                    <PermissionGuard requiredPermission="inventario:editar">
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    </PermissionGuard>
                    <PermissionGuard requiredPermission="inventario:eliminar">
                      <DropdownMenuItem
                        onClick={() => onDelete(item)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </PermissionGuard>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
