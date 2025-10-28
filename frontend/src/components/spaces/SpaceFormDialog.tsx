import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { espaciosApi } from '@/lib/api/spaces';
import type { Espacio, TipoEspacio } from '@/lib/types/spaces';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDialogScrollLock } from '@/hooks/useDialogScrollLock';

interface SpaceFormDialogProps {
  espacio: Espacio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (espacio: Espacio) => void;
}

export function SpaceFormDialog({ 
  espacio, 
  open, 
  onOpenChange, 
  onSuccess 
}: SpaceFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    capacidad: 1,
    tipoEspacioId: 0,
    imagenUrl: '',
    estado: 'DISPONIBLE' as 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE'
  });
  
  // Prevenir layout shift cuando el modal está abierto
  useDialogScrollLock(open);

  const isEditing = !!espacio;

  // Cargar tipos de espacio al abrir el dialog
  useEffect(() => {
    if (open) {
      fetchTiposEspacio();
    }
  }, [open]);

  // Actualizar formData cuando cambia el espacio
  useEffect(() => {
    if (espacio) {
      setFormData({
        nombre: espacio.nombre,
        capacidad: espacio.capacidad,
        tipoEspacioId: espacio.tipoEspacioId,
        imagenUrl: espacio.imagenUrl || '',
        estado: espacio.estado
      });
    } else {
      setFormData({
        nombre: '',
        capacidad: 1,
        tipoEspacioId: 0,
        imagenUrl: '',
        estado: 'DISPONIBLE'
      });
    }
  }, [espacio]);

  const fetchTiposEspacio = async () => {
    try {
      const response = await espaciosApi.listarTiposEspacio();
      if (response.data) {
        setTiposEspacio(response.data);
      }
    } catch (error) {
      console.error('Error al cargar tipos de espacio:', error);
      toast.error('Error al cargar tipos de espacio');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre?.trim()) {
      toast.error('El nombre del espacio es requerido');
      return;
    }

    if (formData.capacidad < 1) {
      toast.error('La capacidad debe ser mayor a 0');
      return;
    }

    if (formData.tipoEspacioId === 0) {
      toast.error('Debe seleccionar un tipo de espacio');
      return;
    }

    try {
      setLoading(true);
      
      const data = {
        nombre: formData.nombre.trim(),
        capacidad: formData.capacidad,
        tipoEspacioId: formData.tipoEspacioId,
        imagenUrl: formData.imagenUrl.trim() || undefined,
        estado: formData.estado
      };

      let response;
      if (isEditing && espacio) {
        response = await espaciosApi.actualizarEspacio(espacio.id, data);
      } else {
        response = await espaciosApi.crearEspacio(data);
      }
      
      toast.success(
        isEditing ? 'Espacio actualizado' : 'Espacio creado',
        {
          description: `${formData.nombre} ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente`
        }
      );
      
      if (response.data) {
        onSuccess(response.data);
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error al guardar espacio:', error);
      toast.error(
        isEditing ? 'Error al actualizar espacio' : 'Error al crear espacio',
        {
          description: error.message || 'No se pudo guardar el espacio'
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Espacio' : 'Crear Nuevo Espacio'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información del espacio seleccionado.'
              : 'Completa la información para crear un nuevo espacio.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] -mx-6 px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Espacio</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Aula 101"
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoEspacio">Tipo de Espacio</Label>
            <Select
              value={formData.tipoEspacioId === 0 ? "seleccionar" : formData.tipoEspacioId?.toString() || "seleccionar"}
              onValueChange={(value) => {
                if (value !== "seleccionar") {
                  setFormData(prev => ({ ...prev, tipoEspacioId: parseInt(value) }));
                }
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seleccionar" disabled>Seleccionar</SelectItem>
                {tiposEspacio.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacidad">Capacidad</Label>
            <Input
              id="capacidad"
              type="number"
              min="1"
              value={formData.capacidad}
              onChange={(e) => setFormData(prev => ({ ...prev, capacidad: parseInt(e.target.value) || 1 }))}
              placeholder="Ej: 30"
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagenUrl">URL de Imagen (Opcional)</Label>
            <Input
              id="imagenUrl"
              type="url"
              value={formData.imagenUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imagenUrl: e.target.value }))}
              placeholder="https://ejemplo.com/imagen.jpg"
              disabled={loading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, estado: value as 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE' }));
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                <SelectItem value="MANTENIMIENTO">En Mantenimiento</SelectItem>
                <SelectItem value="NO_DISPONIBLE">No Disponible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
