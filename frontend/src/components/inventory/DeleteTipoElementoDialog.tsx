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
import { inventarioApi } from '@/lib/api/inventory';
import type { TipoElemento } from '@/lib/types/spaces';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteTipoElementoDialogProps {
  tipoElemento: TipoElemento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteTipoElementoDialog({ 
  tipoElemento, 
  open, 
  onOpenChange, 
  onSuccess 
}: Readonly<DeleteTipoElementoDialogProps>) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!tipoElemento) return;

    try {
      setLoading(true);
      await inventarioApi.eliminarTipoElemento(tipoElemento.id);
      
      toast.success('Tipo de elemento desactivado', {
        description: `${tipoElemento.nombre} ha sido marcado como inactivo exitosamente`
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error al eliminar tipo de elemento:', error);
      toast.error('Error al desactivar tipo de elemento', {
        description: error instanceof Error ? error.message : 'No se pudo desactivar el tipo de elemento'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  if (!tipoElemento) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" />
            Desactivar Tipo de Elemento
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas desactivar el tipo de elemento <strong>"{tipoElemento.nombre}"</strong>?
            <br />
            <br />
            <strong>Atención:</strong> Esta acción marcará el tipo como inactivo. Los items de inventario asociados a este tipo seguirán existiendo, pero el tipo dejará de estar disponible para nuevas creaciones.
            <br />
            <br />
            Esta acción se puede revertir más tarde si es necesario.
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
            Desactivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

