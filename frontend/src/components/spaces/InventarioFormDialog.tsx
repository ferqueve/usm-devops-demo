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
import { espaciosApi } from '@/lib/api/spaces';
import type { TipoElemento, InventarioItem } from '@/lib/types/spaces';
import { toast } from 'sonner';

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
  const [tiposElemento, setTiposElemento] = useState<TipoElemento[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipoElementoId: 0,
    cantidad: 1,
    marca: '',
    modelo: '',
    numeroSerie: '',
    estado: 'DISPONIBLE' as 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO',
    observaciones: '',
    fechaAdquisicion: '',
    valorEstimado: 0
  });

  const isEditing = !!inventarioItem;

  useEffect(() => {
    if (open) {
      fetchTiposElemento();
      if (inventarioItem) {
        setFormData({
          tipoElementoId: inventarioItem.tipoElementoId,
          cantidad: inventarioItem.cantidad,
          marca: inventarioItem.marca || '',
          modelo: inventarioItem.modelo || '',
          numeroSerie: inventarioItem.numeroSerie || '',
          estado: inventarioItem.estado,
          observaciones: inventarioItem.observaciones || '',
          fechaAdquisicion: inventarioItem.fechaAdquisicion || '',
          valorEstimado: inventarioItem.valorEstimado || 0
        });
      } else {
        setFormData({
          tipoElementoId: 0,
          cantidad: 1,
          marca: '',
          modelo: '',
          numeroSerie: '',
          estado: 'DISPONIBLE',
          observaciones: '',
          fechaAdquisicion: '',
          valorEstimado: 0
        });
      }
    }
  }, [open, inventarioItem]);

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
        marca: formData.marca || undefined,
        modelo: formData.modelo || undefined,
        numeroSerie: formData.numeroSerie || undefined,
        estado: formData.estado,
        observaciones: formData.observaciones || undefined,
        fechaAdquisicion: formData.fechaAdquisicion || undefined,
        valorEstimado: formData.valorEstimado || undefined
      };

      let response;
      if (isEditing && inventarioItem) {
        response = await espaciosApi.actualizarInventarioItem(inventarioItem.id, data);
      } else {
        response = await espaciosApi.crearInventarioItem(data);
      }

      if (response.data) {
        onSuccess(response.data);
        onOpenChange(false);
        toast.success(isEditing ? 'Elemento actualizado exitosamente' : 'Elemento agregado exitosamente');
      }
    } catch (error: any) {
      console.error('Error al guardar elemento:', error);
      toast.error('Error al guardar elemento', {
        description: error.message || 'No se pudo guardar el elemento'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Elemento de Inventario' : 'Agregar Elemento de Inventario'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Tipo de Elemento */}
            <div className="space-y-2">
              <Label htmlFor="tipo-elemento">Tipo de Elemento *</Label>
              <Select 
                value={formData.tipoElementoId === 0 ? "0" : formData.tipoElementoId.toString()} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  tipoElementoId: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" disabled>Selecciona un tipo</SelectItem>
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
              />
            </div>

            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  marca: e.target.value 
                }))}
                placeholder="Ej: Samsung, HP, IKEA"
              />
            </div>

            {/* Modelo */}
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  modelo: e.target.value 
                }))}
                placeholder="Ej: 55QN90A, EliteDesk 800"
              />
            </div>

            {/* Número de Serie */}
            <div className="space-y-2">
              <Label htmlFor="numero-serie">Número de Serie</Label>
              <Input
                id="numero-serie"
                value={formData.numeroSerie}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  numeroSerie: e.target.value 
                }))}
                placeholder="Número de serie del elemento"
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                  <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                  <SelectItem value="DANADO">Dañado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha de Adquisición */}
            <div className="space-y-2">
              <Label htmlFor="fecha-adquisicion">Fecha de Adquisición</Label>
              <Input
                id="fecha-adquisicion"
                type="date"
                value={formData.fechaAdquisicion}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  fechaAdquisicion: e.target.value 
                }))}
              />
            </div>

            {/* Valor Estimado */}
            <div className="space-y-2">
              <Label htmlFor="valor-estimado">Valor Estimado (USD)</Label>
              <Input
                id="valor-estimado"
                type="number"
                min="0"
                step="0.01"
                value={formData.valorEstimado}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  valorEstimado: parseFloat(e.target.value) || 0 
                }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
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
              className="min-h-[80px]"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Agregar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
