import { ConfirmarBorradoDialog } from '@/components/common/ConfirmarBorradoDialog';
import { materiasApi } from '@/lib/api/materias';
import type { Materia } from '@/lib/types/materias';

interface Props {
  materia: Materia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Envoltorio fino sobre `ConfirmarBorradoDialog`.
 *
 * Existe para no cambiar los llamadores: la firma `{ materia, open, onOpenChange,
 * onSuccess }` es la que ya usaban. Lo único propio son el nombre de la
 * entidad, de dónde sale su nombre visible, qué llamada la borra y qué
 * consecuencia tiene.
 */
export function DeleteMateriaDialog({ materia, open, onOpenChange, onSuccess }: Readonly<Props>) {
  return (
    <ConfirmarBorradoDialog
      item={materia}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      entidad="materia"
      nombre={(x) => x.nombre}
      eliminar={(x) => materiasApi.eliminarMateria(x.id)}
      consecuencia="Es un borrado lógico: la materia deja de estar disponible para nuevas inscripciones."
    />
  );
}
