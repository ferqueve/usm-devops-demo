import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { carrerasApi } from '@/lib/api/carreras';
import type { Carrera } from '@/lib/types/spaces';

interface DeleteCarreraDialogProps {
  carrera: Carrera | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteCarreraDialog({
  carrera,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<DeleteCarreraDialogProps>) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!carrera) return;
    try {
      setLoading(true);
      await carrerasApi.eliminarCarrera(carrera.id);
      toast.success('Carrera eliminada', {
        description: `${carrera.nombre} fue marcada como inactiva.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo eliminar la carrera';
      toast.error('Error al eliminar carrera', { description });
    } finally {
      setLoading(false);
    }
  };

  if (!carrera) return null;

  return (
    <AlertDialog open={open} onOpenChange={(value) => (loading ? undefined : onOpenChange(value))}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" />
            Eliminar Carrera
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar la carrera <strong>"{carrera.nombre}"</strong>?
            <br />
            <br />
            Esta operación realiza un borrado lógico: la carrera deja de estar disponible para nuevas reservas pero las existentes mantienen su asociación.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-danger hover:bg-danger">
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
