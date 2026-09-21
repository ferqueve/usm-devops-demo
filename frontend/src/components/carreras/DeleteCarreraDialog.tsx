import { ConfirmarBorradoDialog } from '@/components/common/ConfirmarBorradoDialog';
import { carrerasApi } from '@/lib/api/carreras';
import type { Carrera } from '@/lib/types/spaces';

interface Props {
  carrera: Carrera | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Envoltorio fino sobre `ConfirmarBorradoDialog`.
 *
 * Existe para no cambiar los llamadores: la firma `{ carrera, open, onOpenChange,
 * onSuccess }` es la que ya usaban. Lo único propio son el nombre de la
 * entidad, de dónde sale su nombre visible, qué llamada la borra y qué
 * consecuencia tiene.
 */
export function DeleteCarreraDialog({ carrera, open, onOpenChange, onSuccess }: Readonly<Props>) {
  return (
    <ConfirmarBorradoDialog
      item={carrera}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      entidad="carrera"
      nombre={(x) => x.nombre}
      eliminar={(x) => carrerasApi.eliminarCarrera(x.id)}
      consecuencia="Es un borrado lógico: la carrera deja de estar disponible para nuevas reservas, pero las existentes mantienen su asociación."
    />
  );
}
