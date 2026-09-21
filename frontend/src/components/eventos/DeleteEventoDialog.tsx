import { ConfirmarBorradoDialog } from '@/components/common/ConfirmarBorradoDialog';
import { eventosApi } from '@/lib/api/eventos';
import type { Evento } from '@/lib/types/eventos';

interface Props {
  evento: Evento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Envoltorio fino sobre `ConfirmarBorradoDialog`.
 *
 * Existe para no cambiar los llamadores: la firma `{ evento, open, onOpenChange,
 * onSuccess }` es la que ya usaban. Lo único propio son el nombre de la
 * entidad, de dónde sale su nombre visible, qué llamada la borra y qué
 * consecuencia tiene.
 */
export function DeleteEventoDialog({ evento, open, onOpenChange, onSuccess }: Readonly<Props>) {
  return (
    <ConfirmarBorradoDialog
      item={evento}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      entidad="evento"
      nombre={(x) => x.titulo}
      eliminar={(x) => eventosApi.eliminar(x.id)}
      consecuencia="Es un borrado lógico: el evento deja de estar disponible y sus inscripciones quedan inactivas."
    />
  );
}
