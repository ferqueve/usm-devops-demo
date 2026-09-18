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
import { materiasApi } from '@/lib/api/materias';
import type { Materia } from '@/lib/types/materias';

interface DeleteMateriaDialogProps {
  materia: Materia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteMateriaDialog({
  materia,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<DeleteMateriaDialogProps>) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!materia) return;
    try {
      setLoading(true);
      await materiasApi.eliminarMateria(materia.id);
      toast.success('Materia eliminada', {
        description: `${materia.nombre} fue marcada como inactiva.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo eliminar la materia';
      toast.error('Error al eliminar materia', { description });
    } finally {
      setLoading(false);
    }
  };

  if (!materia) return null;

  return (
    <AlertDialog open={open} onOpenChange={(value) => (loading ? undefined : onOpenChange(value))}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" />
            Eliminar Materia
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar la materia <strong>"{materia.nombre}"</strong>?
            <br />
            <br />
            Esta operación realiza un borrado lógico: la materia deja de estar disponible para nuevas inscripciones.
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
