import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inventarioApi } from '@/lib/api/inventory';
import { useTiposElemento } from '@/hooks/useTiposElemento';
import type { InventarioItem } from '@/lib/types/spaces';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface InventarioFormDialogProps {
  espacioId: number;
  inventarioItem?: InventarioItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (item: InventarioItem) => void;
}

export function InventarioFormDialog({
  espacioId,
  inventarioItem,
  open,
  onOpenChange,
  onSuccess
}: InventarioFormDialogProps) {
  const { tiposElemento } = useTiposElemento();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipoElementoId: 0,
    cantidad: 1,
    estado: 'DISPONIBLE' as 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO',
    observaciones: '',
  });

  const isEditing = !!inventarioItem;

  useEffect(() => {
    if (open) {
      if (inventarioItem) {
        setFormData({
          tipoElementoId: inventarioItem.tipoElementoId,
          cantidad: inventarioItem.cantidad,
          estado: inventarioItem.estado,
          observaciones: inventarioItem.observaciones || '',
        });
      } else {
        setFormData({
          tipoElementoId: 0,
          cantidad: 1,
          estado: 'DISPONIBLE',
          observaciones: '',
        });
      }
    }
  }, [open, inventarioItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.tipoElementoId === 0) {
      toast.error('Por favor selecciona un tipo de elemento');
      return;
    }

    if (formData.cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      setLoading(true);

      const data = {
        espacioId,
        tipoElementoId: formData.tipoElementoId,
        cantidad: formData.cantidad,
        estado: formData.estado,
        observaciones: formData.observaciones || undefined
      };

      let response;
      if (isEditing && inventarioItem) {
        response = await inventarioApi.actualizarInventarioItem(inventarioItem.id, data);
      } else {
        response = await inventarioApi.crearInventarioItem(data);
      }

      if (response.data) {
        onSuccess(response.data);
        onOpenChange(false);
        toast.success(isEditing ? 'Elemento actualizado exitosamente' : 'Elemento agregado exitosamente');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el elemento';
      console.error('Error al guardar elemento:', error);
      toast.error('Error al guardar elemento', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[90vh] !flex !flex-col overflow-hidden mx-4 !p-0 !gap-0">
        <div className="px-6 py-4 border-b">
          <DialogHeader className="!p-0">
            <DialogTitle>
              {isEditing ? 'Editar Elemento de Inventario' : 'Agregar Elemento de Inventario'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="inventario-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {/* Tipo de Elemento */}
              <div className="space-y-2">
                <Label htmlFor="tipo-elemento">Tipo de Elemento *</Label>
                <Select
                  value={formData.tipoElementoId === 0 ? "seleccionar" : formData.tipoElementoId.toString()}
                  onValueChange={(value) => {
                    if (value !== "seleccionar") {
                      setFormData(prev => ({
                        ...prev,
                        tipoElementoId: parseInt(value)
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seleccionar" disabled>Seleccionar</SelectItem>
                    {tiposElemento.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cantidad: parseInt(e.target.value) || 1
                  }))}
                  required
                  className="w-full"
                />
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO') =>
                    setFormData(prev => ({ ...prev, estado: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                    <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                    <SelectItem value="DANADO">Dañado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2 w-full">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  observaciones: e.target.value
                }))}
                placeholder="Observaciones adicionales sobre el elemento..."
                rows={3}
                className="w-full min-h-[80px]"
              />
            </div>
          </form>
        </div>

        {/* Botones */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <PermissionGuard requiredPermissions={isEditing ? ['inventario:editar'] : ['inventario:crear']}>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Agregar')}
            </Button>
          </PermissionGuard>
        </div>
      </DialogContent>
    </Dialog >
  );
}
