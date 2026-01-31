import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { inventarioApi } from '@/lib/api/inventory';
import type { InventarioItem } from '@/lib/types/spaces';
import { toast } from 'sonner';
import { useState } from 'react';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface DeleteInventoryDialogProps {
  item: InventarioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DeleteInventoryDialog({ 
  item, 
  open, 
  onOpenChange, 
  onSuccess 
}: DeleteInventoryDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!item) return;
    
    try {
      setLoading(true);
      await inventarioApi.eliminarInventarioItem(item.id);
      onSuccess();
      onOpenChange(false);
      toast.success('Item eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar item:', error);
      toast.error('Error al eliminar item', {
        description: error.message || 'No se pudo eliminar el item'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará el item de inventario: <strong>{item?.tipoElementoNombre}</strong>
            <br />
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <PermissionGuard requiredPermission="inventario:eliminar">
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </PermissionGuard>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
