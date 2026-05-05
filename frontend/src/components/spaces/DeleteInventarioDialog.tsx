import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";
import { inventarioApi } from '@/lib/api/inventory';
import type { InventarioItem } from '@/lib/types/spaces';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface DeleteInventarioDialogProps {
  inventarioItem: InventarioItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteInventarioDialog({
  inventarioItem,
  open,
  onOpenChange,
  onSuccess
}: Readonly<DeleteInventarioDialogProps>) {
  const handleDelete = async () => {
    try {
      await inventarioApi.eliminarInventarioItem(inventarioItem.id);
      onSuccess();
      onOpenChange(false);
      toast.success('Elemento eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar elemento:', error);
      toast.error('Error al eliminar elemento', {
        description: error.message || 'No se pudo eliminar el elemento'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Eliminar Elemento de Inventario
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar este elemento del inventario?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Elemento a eliminar:</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Tipo:</span> {inventarioItem.tipoElementoNombre}</p>
            <p><span className="font-medium">Cantidad:</span> {inventarioItem.cantidad}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <PermissionGuard requiredPermission="inventario:eliminar">
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </PermissionGuard>
        </div>
      </DialogContent>
    </Dialog>
  );
}
