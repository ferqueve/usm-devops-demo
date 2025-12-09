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
import { espaciosApi } from '@/lib/api/spaces';
import type { InventarioItem, TipoElemento, Espacio } from '@/lib/types/spaces';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface InventoryFormDialogProps {
  item: InventarioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (item: InventarioItem) => void;
}

export default function InventoryFormDialog({ 
  item, 
  open, 
  onOpenChange, 
  onSuccess 
}: InventoryFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [tiposElemento, setTiposElemento] = useState<TipoElemento[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    espacioId: null as number | null,
    tipoElementoId: 0,
    cantidad: 1,
    estado: 'DISPONIBLE' as 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO',
    observaciones: '',
  });

  useEffect(() => {
    if (open) {
      fetchEspacios();
      fetchTiposElemento();
      
      if (item) {
        setFormData({
          espacioId: item.espacioId ?? null,
          tipoElementoId: item.tipoElementoId,
          cantidad: item.cantidad,
          estado: item.estado,
          observaciones: item.observaciones || '',
        });
      } else {
        // Reset form for new item
        setFormData({
          espacioId: null,
          tipoElementoId: 0,
          cantidad: 1,
          estado: 'DISPONIBLE',
          observaciones: '',
        });
      }
    }
  }, [open, item]);

  const fetchEspacios = async () => {
    try {
      const response = await espaciosApi.obtenerEspacios();
      if (response.data) {
        setEspacios(response.data);
      }
    } catch (error) {
      console.error('Error al cargar espacios:', error);
    }
  };

  const fetchTiposElemento = async () => {
    try {
      const response = await espaciosApi.listarTiposElemento();
      if (response.data) {
        setTiposElemento(response.data);
      }
    } catch (error) {
      console.error('Error al cargar tipos de elemento:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.tipoElementoId === 0) {
      toast.error('Debe seleccionar un tipo de elemento');
      return;
    }
    
    // En edición, no requerir espacio si el item es sin asignar
    if (!item && !formData.espacioId) {
      toast.error('Debe seleccionar un espacio');
      return;
    }
    
    try {
      setLoading(true);
      
      const submitData = {
        espacioId: formData.espacioId ?? 0,
        tipoElementoId: formData.tipoElementoId,
        cantidad: formData.cantidad,
        estado: formData.estado,
        observaciones: formData.observaciones || undefined,
      };
      
      let result: InventarioItem;
      
      if (item) {
        const response = await espaciosApi.actualizarInventarioItem(item.id, submitData);
        result = (response.data || response) as InventarioItem;
      } else {
        const response = await espaciosApi.crearInventarioItem(submitData);
        result = (response.data || response) as InventarioItem;
      }
      
      onSuccess(result);
      onOpenChange(false);
      toast.success(item ? 'Item actualizado exitosamente' : 'Item creado exitosamente');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el item';
      console.error('Error al guardar item:', error);
      toast.error('Error al guardar item', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar Item de Inventario' : 'Agregar Item de Inventario'}
          </DialogTitle>
          <DialogDescription>
            {item ? 'Modifica la información del item de inventario' : 'Completa la información para agregar un nuevo item'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] -mx-6 px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Espacio */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="espacio">{item ? 'Espacio' : 'Espacio *'}</Label>
              <Select
                value={formData.espacioId === null ? "sin-asignar" : (formData.espacioId === 0 ? "seleccionar" : formData.espacioId.toString())}
                onValueChange={(value) => {
                  if (value === "sin-asignar") {
                    setFormData({ ...formData, espacioId: null });
                  } else if (value !== "seleccionar") {
                    setFormData({ ...formData, espacioId: parseInt(value) });
                  }
                }}
              >
                <SelectTrigger id="espacio" className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seleccionar" disabled>Seleccionar</SelectItem>
                  <SelectItem value="sin-asignar">
                    Sin asignar
                  </SelectItem>
                  {espacios.map((espacio) => (
                    <SelectItem key={espacio.id} value={espacio.id.toString()}>
                      {espacio.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Elemento */}
            <div className="space-y-2">
              <Label htmlFor="tipoElemento">Tipo de Elemento *</Label>
              <Select
                value={formData.tipoElementoId === 0 ? "seleccionar" : formData.tipoElementoId.toString()}
                onValueChange={(value) => {
                  if (value !== "seleccionar") {
                    setFormData({ ...formData, tipoElementoId: parseInt(value) });
                  }
                }}
              >
                <SelectTrigger id="tipoElemento" className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seleccionar" disabled>Seleccionar</SelectItem>
                  {tiposElemento.map((tipo) => (
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
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
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
                  setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger id="estado" className="w-full">
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
              rows={3}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full"
            />
          </div>
        </form>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <PermissionGuard requiredPermissions={item ? ['inventario:editar'] : ['inventario:crear']}>
            <Button type="submit" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Guardando...' : (item ? 'Actualizar' : 'Crear')}
            </Button>
          </PermissionGuard>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
