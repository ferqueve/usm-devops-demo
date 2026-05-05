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
import { inventarioApi } from '@/lib/api/inventory';
import type { TipoElemento } from '@/lib/types/spaces';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface TipoElementoFormDialogProps {
  tipoElemento: TipoElemento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tipoElemento: TipoElemento) => void;
}

export function TipoElementoFormDialog({ 
  tipoElemento, 
  open, 
  onOpenChange, 
  onSuccess 
}: Readonly<TipoElementoFormDialogProps>) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  const isEditing = !!tipoElemento;

  useEffect(() => {
    if (tipoElemento) {
      setFormData({
        nombre: tipoElemento.nombre,
        descripcion: tipoElemento.descripcion || ''
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: ''
      });
    }
  }, [tipoElemento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre?.trim()) {
      toast.error('El nombre del tipo de elemento es requerido');
      return;
    }

    try {
      setLoading(true);
      
      const data = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined
      };

      let response;
      if (isEditing && tipoElemento) {
        response = await inventarioApi.actualizarTipoElemento(tipoElemento.id, data);
      } else {
        response = await inventarioApi.crearTipoElemento(data);
      }
      
      toast.success(
        isEditing ? 'Tipo de elemento actualizado' : 'Tipo de elemento creado',
        {
          description: `${formData.nombre} ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente`
        }
      );
      
      if (response.data) {
        onSuccess(response.data);
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el tipo de elemento';
      console.error('Error al guardar tipo de elemento:', error);
      toast.error(
        isEditing ? 'Error al actualizar tipo de elemento' : 'Error al crear tipo de elemento',
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
            {isEditing ? 'Editar Tipo de Elemento' : 'Crear Nuevo Tipo de Elemento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información del tipo de elemento seleccionado.'
              : 'Completa la información para crear un nuevo tipo de elemento.'
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
              placeholder="Ej: Proyector, Computadora, Mesa"
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
              placeholder="Descripción del tipo de elemento..."
              disabled={loading}
              rows={3}
              className="w-full"
            />
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
          <PermissionGuard requiredPermissions={isEditing ? ['tipo:editar'] : ['tipo:crear']}>
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

