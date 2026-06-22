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
import { eventosApi } from '@/lib/api/eventos';
import type { Evento } from '@/lib/types/eventos';

interface DeleteEventoDialogProps {
  evento: Evento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteEventoDialog({
  evento,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<DeleteEventoDialogProps>) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!evento) return;
    try {
      setLoading(true);
      await eventosApi.eliminar(evento.id);
      toast.success('Evento eliminado', {
        description: `${evento.titulo} fue eliminado.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo eliminar el evento';
      toast.error('Error al eliminar evento', { description });
    } finally {
      setLoading(false);
    }
  };

  if (!evento) return null;

  return (
    <AlertDialog open={open} onOpenChange={(value) => (loading ? undefined : onOpenChange(value))}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Eliminar Evento
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar el evento <strong>"{evento.titulo}"</strong>?
            <br />
            <br />
            Esta operación realiza un borrado lógico: el evento dejará de estar disponible y sus inscripciones quedarán inactivas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
