import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useEspacios } from '@/hooks/useEspacios';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import type { InventarioItem } from '@/lib/types/spaces';
import { toast } from 'sonner';
import { moveInventoryQuantity } from './_shared/inventoryAssignment';

interface AssignSpaceDialogProps {
  item: InventarioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AssignSpaceDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<AssignSpaceDialogProps>) {
  const [loading, setLoading] = useState(false);
  const { espacios } = useEspacios();
  const { hasPermission } = useRolePermissions();
  const [selectedEspacioId, setSelectedEspacioId] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);

  useEffect(() => {
    if (open) {
      if (item) {
        setSelectedEspacioId(item.espacioId || 0);
        setCantidad(item.cantidad);
      } else {
        setSelectedEspacioId(0);
        setCantidad(1);
      }
    }
  }, [open, item]);

  const validateCantidad = (currentItem: InventarioItem): boolean => {
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return false;
    }
    if (cantidad > currentItem.cantidad) {
      toast.error(`La cantidad no puede ser mayor a ${currentItem.cantidad}`);
      return false;
    }
    return true;
  };

  const performMove = async (
    targetEspacioId: number,
    successMessage: () => string,
    errorTitle: string,
    errorFallback: string,
  ) => {
    if (!item) return;
    if (!validateCantidad(item)) return;

    try {
      setLoading(true);
      const completed = await moveInventoryQuantity({
        item,
        targetEspacioId,
        cantidad,
        canSplit: () => hasPermission('inventario:crear'),
        onSplitDenied: () => {
          toast.error('Permiso denegado', {
            description:
              'No tienes permiso para dividir inventario (requiere inventario:crear)',
          });
        },
      });

      if (completed) {
        toast.success(successMessage());
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: unknown) {
      console.error(`${errorTitle}:`, error);
      toast.error(errorTitle, {
        description: error instanceof Error ? error.message : errorFallback,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDesasignar = () =>
    performMove(
      0,
      () =>
        cantidad < (item?.cantidad ?? 0)
          ? `${cantidad} ${item?.tipoElementoNombre}(s) desasignado(s) exitosamente`
          : 'Espacio desasignado exitosamente',
      'Error al desasignar espacio',
      'No se pudo desasignar el espacio',
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEspacioId === 0) {
      toast.error('Por favor selecciona un espacio');
      return;
    }
    await performMove(
      selectedEspacioId,
      () =>
        cantidad < (item?.cantidad ?? 0)
          ? `${cantidad} ${item?.tipoElementoNombre}(s) asignado(s) exitosamente`
          : 'Espacio asignado exitosamente',
      'Error al asignar espacio',
      'No se pudo asignar el espacio',
    );
  };

  const currentEspacio = item?.espacioId
    ? espacios.find((e) => e.id === item.espacioId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>{item?.espacioId ? 'Reasignar Espacio' : 'Asignar Espacio'}</DialogTitle>
          <DialogDescription>
            Selecciona el espacio para el item <strong>{item?.tipoElementoNombre}</strong>
            {(() => {
              if (currentEspacio) {
                return (
                  <>
                    <br />
                    <span className="text-sm text-muted-foreground">
                      Actualmente asignado a: <strong>{currentEspacio.nombre}</strong>
                    </span>
                  </>
                );
              }
              if (item?.espacioId === null) {
                return (
                  <>
                    <br />
                    <span className="text-sm text-muted-foreground">
                      Actualmente: <strong>Sin asignar</strong>
                    </span>
                  </>
                );
              }
              return null;
            })()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="espacio">{item?.espacioId ? 'Nuevo Espacio *' : 'Espacio *'}</Label>
            <Select
              value={selectedEspacioId === 0 ? "seleccionar" : selectedEspacioId.toString()}
              onValueChange={(value) => {
                if (value !== "seleccionar") {
                  setSelectedEspacioId(Number.parseInt(value));
                }
              }}
            >
              <SelectTrigger id="espacio" className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seleccionar" disabled>Seleccionar</SelectItem>
                {espacios.map((espacio) => (
                  <SelectItem key={espacio.id} value={espacio.id.toString()}>
                    {espacio.nombre} (Capacidad: {espacio.capacidad})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad * (máximo: {item?.cantidad})</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              max={item?.cantidad}
              value={cantidad}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value) || 0;
                setCantidad(Math.min(value, item?.cantidad || 1));
              }}
              placeholder="Cantidad a asignar"
            />
            {cantidad < (item?.cantidad || 0) && (
              <p className="text-xs text-muted-foreground">
                Se asignarán {cantidad} {item?.tipoElementoNombre}(s) al nuevo espacio y se dejarán {(item?.cantidad || 0) - cantidad} en el espacio actual.
              </p>
            )}
          </div>

          {/* Botón de desasignar - solo si el item tiene un espacio asignado */}
          {item?.espacioId && (
            <div className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleDesasignar}
                disabled={loading}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Desasignar ({cantidad})
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {(() => {
                if (loading) return item?.espacioId ? 'Reasignando...' : 'Asignando...';
                return item?.espacioId ? `Reasignar (${cantidad})` : `Asignar (${cantidad})`;
              })()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
