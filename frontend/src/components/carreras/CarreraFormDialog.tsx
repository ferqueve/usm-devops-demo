import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { carrerasApi } from '@/lib/api/carreras';
import type { Carrera } from '@/lib/types/spaces';

interface CarreraFormDialogProps {
  carrera: Carrera | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (carrera: Carrera) => void;
}

export function CarreraFormDialog({
  carrera,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<CarreraFormDialogProps>) {
  const isEditing = !!carrera;
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');

  useEffect(() => {
    if (open) {
      setNombre(carrera?.nombre ?? '');
      setCodigo(carrera?.codigo ?? '');
    }
  }, [open, carrera]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre de la carrera es requerido');
      return;
    }
    try {
      setLoading(true);
      const data = {
        nombre: nombre.trim(),
        codigo: codigo.trim() || undefined,
      };
      const response = isEditing && carrera
        ? await carrerasApi.actualizarCarrera(carrera.id, data)
        : await carrerasApi.crearCarrera(data);
      if (response.data) {
        toast.success(isEditing ? 'Carrera actualizada' : 'Carrera creada');
        onSuccess(response.data);
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo guardar la carrera';
      toast.error(isEditing ? 'Error al actualizar carrera' : 'Error al crear carrera', { description });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (loading ? undefined : onOpenChange(value))}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Carrera' : 'Crear Nueva Carrera'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica el nombre o el código de la carrera seleccionada.'
              : 'Completa los datos para crear una nueva carrera.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="carrera-nombre">Nombre de la Carrera</Label>
            <Input
              id="carrera-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Ingeniería en Sistemas"
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carrera-codigo">Código (Opcional)</Label>
            <Input
              id="carrera-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: ITR-IS"
              disabled={loading}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <PermissionGuard requiredPermissions={[isEditing ? 'carrera:editar' : 'carrera:crear']}>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </PermissionGuard>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
