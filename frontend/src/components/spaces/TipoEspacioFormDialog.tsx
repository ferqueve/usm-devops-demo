import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { espaciosApi } from '@/lib/api/spaces';
import type { TipoEspacio } from '@/lib/types/spaces';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDialogScrollLock } from '@/hooks/useDialogScrollLock';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface TipoEspacioFormDialogProps {
  tipoEspacio: TipoEspacio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tipoEspacio: TipoEspacio) => void;
}

export function TipoEspacioFormDialog({ 
  tipoEspacio, 
  open, 
  onOpenChange, 
  onSuccess 
}: TipoEspacioFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: ''
  });
  
  useDialogScrollLock(open);

  const isEditing = !!tipoEspacio;

  useEffect(() => {
    if (tipoEspacio) {
      setFormData({
        nombre: tipoEspacio.nombre,
        descripcion: tipoEspacio.descripcion || '',
        color: tipoEspacio.color || ''
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        color: ''
      });
    }
  }, [tipoEspacio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre?.trim()) {
      toast.error('El nombre del tipo de espacio es requerido');
      return;
    }

    try {
      setLoading(true);
      
      const data = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        color: formData.color.trim() || undefined
      };

      let response;
      if (isEditing && tipoEspacio) {
        response = await espaciosApi.actualizarTipoEspacio(tipoEspacio.id, data);
      } else {
        response = await espaciosApi.crearTipoEspacio(data);
      }
      
      toast.success(
        isEditing ? 'Tipo de espacio actualizado' : 'Tipo de espacio creado',
        {
          description: `${formData.nombre} ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente`
        }
      );
      
      if (response.data) {
        onSuccess(response.data);
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el tipo de espacio';
      console.error('Error al guardar tipo de espacio:', error);
      toast.error(
        isEditing ? 'Error al actualizar tipo de espacio' : 'Error al crear tipo de espacio',
        {
          description: errorMessage
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
            {isEditing ? 'Editar Tipo de Espacio' : 'Crear Nuevo Tipo de Espacio'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información del tipo de espacio seleccionado.'
              : 'Completa la información para crear un nuevo tipo de espacio.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] -mx-6 px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Tipo</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Aula, Laboratorio, Salón"
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción del tipo de espacio..."
              disabled={loading}
              rows={3}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color (Opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color || '#3B82F6'}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                disabled={loading}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#3B82F6"
                disabled={loading}
                className="flex-1"
                pattern="^#[0-9A-F]{6}$"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Deja en blanco para generar un color automáticamente
            </p>
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
          <PermissionGuard requiredPermissions={isEditing ? ['tipos_espacio:editar'] : ['tipos_espacio:crear']}>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </PermissionGuard>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
