import { ConfirmarBorradoDialog } from '@/components/common/ConfirmarBorradoDialog';
import { inventarioApi } from '@/lib/api/inventory';
import type { InventarioItem } from '@/lib/types/spaces';

interface Props {
  item: InventarioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Envoltorio fino sobre `ConfirmarBorradoDialog`.
 *
 * Se exporta por defecto porque así lo importan sus llamadores.
 */
export default function DeleteInventoryDialog({ item, open, onOpenChange, onSuccess }: Readonly<Props>) {
  return (
    <ConfirmarBorradoDialog
      item={item}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      entidad="item de inventario"
      nombre={(x) => x.tipoElementoNombre}
      eliminar={(x) => inventarioApi.eliminarInventarioItem(x.id)}
      consecuencia="No se puede deshacer."
      permiso="inventario:eliminar"
    />
  );
}
