import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';
import { useCarreras } from '@/hooks/useCarreras';
import type { Carrera } from '@/lib/types/spaces';
import { TipoCrudShell } from '@/components/common/TipoCrudShell';
import { CarreraFormDialog } from './CarreraFormDialog';
import { DeleteCarreraDialog } from './DeleteCarreraDialog';

/** Catálogo de carreras. Vive como sección de Configuración. */
export function CarrerasManagement() {
  const { carreras, loading, refresh } = useCarreras();
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Carrera | null>(null);

  const activas = carreras.filter((c) => !c.deletedAt);

  const handleCreate = () => {
    setSelected(null);
    setCreateDialog(true);
  };
  const handleEdit = (carrera: Carrera) => {
    setSelected(carrera);
    setEditDialog(true);
  };
  const handleDelete = (carrera: Carrera) => {
    setSelected(carrera);
    setDeleteDialog(true);
  };
  const handleSuccess = () => {
    refresh();
  };

  return (
    <>
      <TipoCrudShell<Carrera>
        variant="inline"
        title="Carreras"
        description="Administra las carreras disponibles para asociar a las reservas. Soporta alta, edición y baja lógica."
        loading={loading}
        items={activas}
        loadingLabel="Cargando carreras..."
        emptyLabel="No hay carreras registradas"
        EmptyIcon={GraduationCap}
        createLabel="Crear Carrera"
        renderRowLeading={() => (
          <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        renderRowMeta={(carrera) =>
          carrera.codigo && (
            <Badge variant="outline" className="mt-1 text-xs">
              {carrera.codigo}
            </Badge>
          )
        }
        permissions={{
          crear: 'carrera:crear',
          editar: 'carrera:editar',
          eliminar: 'carrera:eliminar',
        }}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CarreraFormDialog
        carrera={null}
        open={createDialog}
        onOpenChange={setCreateDialog}
        onSuccess={handleSuccess}
      />
      <CarreraFormDialog
        carrera={selected}
        open={editDialog}
        onOpenChange={setEditDialog}
        onSuccess={handleSuccess}
      />
      <DeleteCarreraDialog
        carrera={selected}
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onSuccess={handleSuccess}
      />
    </>
  );
}
