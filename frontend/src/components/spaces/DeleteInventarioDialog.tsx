import { ConfirmarBorradoDialog } from '@/components/common/ConfirmarBorradoDialog';
import { inventarioApi } from '@/lib/api/inventory';
import type { InventarioItem } from '@/lib/types/spaces';

interface Props {
  inventarioItem: InventarioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Envoltorio fino sobre `ConfirmarBorradoDialog`.
 *
 * Existe para no cambiar los llamadores: la firma `{ inventarioItem, open, onOpenChange,
 * onSuccess }` es la que ya usaban. Lo único propio son el nombre de la
 * entidad, de dónde sale su nombre visible, qué llamada la borra y qué
 * consecuencia tiene.
 */
export function DeleteInventarioDialog({ inventarioItem, open, onOpenChange, onSuccess }: Readonly<Props>) {
  return (
    <ConfirmarBorradoDialog
      item={inventarioItem}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      entidad="asignación"
      nombre={(x) => x.tipoElementoNombre}
      eliminar={(x) => inventarioApi.eliminarInventarioItem(x.id)}
      consecuencia="No se puede deshacer."
      detalle={(x) => [{ etiqueta: 'Cantidad', valor: x.cantidad }]}
      permiso="inventario:eliminar"
    />
  );
}
