import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';
import { useCarreras } from '@/hooks/useCarreras';
import type { Carrera } from '@/lib/types/spaces';
import { CatalogoCrudShell } from '@/components/common/CatalogoCrudShell';
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
      <CatalogoCrudShell<Carrera>
        title="Carreras"
        description="Se asocian a las reservas. La baja es lógica."
        Icon={GraduationCap}
        loading={loading}
        items={activas}
        emptyLabel="Todavía no hay carreras registradas"
        createLabel="Crear carrera"
        columns={2}
        pageSize={10}
        renderRowMeta={(carrera) =>
          carrera.codigo && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
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
