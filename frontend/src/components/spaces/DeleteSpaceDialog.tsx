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
import { espaciosApi } from '@/lib/api/spaces';
import type { Espacio } from '@/lib/types/spaces';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteSpaceDialogProps {
  espacio: Espacio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteSpaceDialog({ 
  espacio, 
  open, 
  onOpenChange, 
  onSuccess 
}: Readonly<DeleteSpaceDialogProps>) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!espacio) return;

    try {
      setLoading(true);
      await espaciosApi.eliminarEspacio(espacio.id);
      
      toast.success('Espacio eliminado', {
        description: `${espacio.nombre} ha sido eliminado exitosamente`
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error al eliminar espacio:', error);
      const description = error instanceof Error ? error.message : 'No se pudo eliminar el espacio';
      toast.error('Error al eliminar espacio', { description });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  if (!espacio) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" />
            Eliminar Espacio
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar el espacio <strong>"{espacio.nombre}"</strong>?
            <br />
            <br />
            Esta acción no se puede deshacer y se eliminarán todos los datos asociados al espacio.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-danger hover:bg-danger"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : null}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
