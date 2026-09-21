import { ConfirmarBorradoDialog } from '@/components/common/ConfirmarBorradoDialog';
import { espaciosApi } from '@/lib/api/spaces';
import type { TipoEspacio } from '@/lib/types/spaces';

interface Props {
  tipoEspacio: TipoEspacio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Envoltorio fino sobre `ConfirmarBorradoDialog`.
 *
 * Existe para no cambiar los llamadores: la firma `{ tipoEspacio, open, onOpenChange,
 * onSuccess }` es la que ya usaban. Lo único propio son el nombre de la
 * entidad, de dónde sale su nombre visible, qué llamada la borra y qué
 * consecuencia tiene.
 */
export function DeleteTipoEspacioDialog({ tipoEspacio, open, onOpenChange, onSuccess }: Readonly<Props>) {
  return (
    <ConfirmarBorradoDialog
      item={tipoEspacio}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      entidad="tipo de espacio"
      nombre={(x) => x.nombre}
      eliminar={(x) => espaciosApi.eliminarTipoEspacio(x.id)}
      consecuencia="Marca el tipo como inactivo. Los espacios de ese tipo siguen existiendo, pero el tipo deja de poder elegirse."
      permiso="tipo:eliminar"

    />
  );
}
