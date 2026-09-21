import { ConfirmarBorradoDialog } from '@/components/common/ConfirmarBorradoDialog';
import { espaciosApi } from '@/lib/api/spaces';
import type { Espacio } from '@/lib/types/spaces';

interface Props {
  espacio: Espacio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Envoltorio fino sobre `ConfirmarBorradoDialog`.
 *
 * Existe para no cambiar los llamadores: la firma `{ espacio, open, onOpenChange,
 * onSuccess }` es la que ya usaban. Lo único propio son el nombre de la
 * entidad, de dónde sale su nombre visible, qué llamada la borra y qué
 * consecuencia tiene.
 */
export function DeleteSpaceDialog({ espacio, open, onOpenChange, onSuccess }: Readonly<Props>) {
  return (
    <ConfirmarBorradoDialog
      item={espacio}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      entidad="espacio"
      nombre={(x) => x.nombre}
      eliminar={(x) => espaciosApi.eliminarEspacio(x.id)}
      consecuencia="No se puede deshacer: se eliminan también todos los datos asociados al espacio."
    />
  );
}
