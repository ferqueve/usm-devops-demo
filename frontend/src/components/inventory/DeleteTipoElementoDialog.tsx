import { ConfirmarBorradoDialog } from '@/components/common/ConfirmarBorradoDialog';
import { inventarioApi } from '@/lib/api/inventory';
import type { TipoElemento } from '@/lib/types/spaces';

interface Props {
  tipoElemento: TipoElemento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Envoltorio fino sobre `ConfirmarBorradoDialog`.
 *
 * Existe para no cambiar los llamadores: la firma `{ tipoElemento, open, onOpenChange,
 * onSuccess }` es la que ya usaban. Lo único propio son el nombre de la
 * entidad, de dónde sale su nombre visible, qué llamada la borra y qué
 * consecuencia tiene.
 */
export function DeleteTipoElementoDialog({ tipoElemento, open, onOpenChange, onSuccess }: Readonly<Props>) {
  return (
    <ConfirmarBorradoDialog
      item={tipoElemento}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      entidad="tipo de elemento"
      nombre={(x) => x.nombre}
      eliminar={(x) => inventarioApi.eliminarTipoElemento(x.id)}
      consecuencia="Marca el tipo como inactivo. Los items de ese tipo siguen existiendo, pero el tipo deja de poder elegirse."
    />
  );
}
