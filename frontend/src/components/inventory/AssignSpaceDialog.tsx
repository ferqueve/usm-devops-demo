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
import { inventarioApi } from '@/lib/api/inventory';
import { useEspacios } from '@/hooks/useEspacios';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import type { InventarioItem } from '@/lib/types/spaces';
import { toast } from 'sonner';

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
  onSuccess
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

  const handleDesasignar = async () => {
    if (!item) return;

    // Validar cantidad
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (cantidad > item.cantidad) {
      toast.error(`La cantidad no puede ser mayor a ${item.cantidad}`);
      return;
    }
    
    try {
      setLoading(true);

      // Si la cantidad es menor que el total, dividir el inventario
      if (cantidad < item.cantidad) {
        // Validar permiso para crear nuevo item (split)
        if (!hasPermission('inventario:crear')) {
          toast.error('Permiso denegado', {
            description: 'No tienes permiso para dividir inventario (requiere inventario:crear)'
          });
          return;
        }

        // Actualizar el item actual reduciendo la cantidad
        await inventarioApi.actualizarInventarioItem(item.id, {
          espacioId: item.espacioId,
          tipoElementoId: item.tipoElementoId,
          cantidad: item.cantidad - cantidad,
          estado: item.estado,
          observaciones: item.observaciones
        });

        // Crear un nuevo item sin asignar con la cantidad desasignada
        await inventarioApi.crearInventarioItem({
          espacioId: 0, // Sin asignar
          tipoElementoId: item.tipoElementoId,
          cantidad: cantidad,
          estado: item.estado,
          observaciones: item.observaciones
        });

        toast.success(`${cantidad} ${item.tipoElementoNombre}(s) desasignado(s) exitosamente`);
        onSuccess();
      } else {
        // Si es la cantidad total, desasignar todo
        await inventarioApi.actualizarInventarioItem(item.id, {
          espacioId: 0, // 0 significa desasignar en el backend
          tipoElementoId: item.tipoElementoId,
          cantidad: item.cantidad,
          estado: item.estado,
          observaciones: item.observaciones
        });
        
        toast.success('Espacio desasignado exitosamente');
        onSuccess();
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al desasignar espacio:', error);
      toast.error('Error al desasignar espacio', {
        description: error.message || 'No se pudo desasignar el espacio'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;
    
    if (selectedEspacioId === 0) {
      toast.error('Por favor selecciona un espacio');
      return;
    }

    // Validar cantidad
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (cantidad > item.cantidad) {
      toast.error(`La cantidad no puede ser mayor a ${item.cantidad}`);
      return;
    }
    
    try {
      setLoading(true);

      // Si la cantidad es menor que el total, dividir el inventario
      if (cantidad < item.cantidad) {
        // Validar permiso para crear nuevo item (split)
        if (!hasPermission('inventario:crear')) {
          toast.error('Permiso denegado', {
            description: 'No tienes permiso para dividir inventario (requiere inventario:crear)'
          });
          return;
        }

        // Actualizar el item actual con la cantidad restante
        await inventarioApi.actualizarInventarioItem(item.id, {
          espacioId: item.espacioId,
          tipoElementoId: item.tipoElementoId,
          cantidad: item.cantidad - cantidad,
          estado: item.estado,
          observaciones: item.observaciones
        });

        // Crear un nuevo item con la cantidad asignada al nuevo espacio
        await inventarioApi.crearInventarioItem({
          espacioId: selectedEspacioId,
          tipoElementoId: item.tipoElementoId,
          cantidad: cantidad,
          estado: item.estado,
          observaciones: item.observaciones
        });

        toast.success(`${cantidad} ${item.tipoElementoNombre}(s) asignado(s) exitosamente`);
        onSuccess();
      } else {
        // Si es la cantidad total, solo actualizar el espacio
        await inventarioApi.actualizarInventarioItem(item.id, {
          espacioId: selectedEspacioId,
          tipoElementoId: item.tipoElementoId,
          cantidad: item.cantidad,
          estado: item.estado,
          observaciones: item.observaciones
        });
        
        toast.success('Espacio asignado exitosamente');
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al asignar espacio:', error);
      toast.error('Error al asignar espacio', {
        description: error.message || 'No se pudo asignar el espacio'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentEspacio = item?.espacioId ? espacios.find(e => e.id === item.espacioId) : null;

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
