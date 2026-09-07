import { useState } from 'react';
import { useTiposElemento } from '@/hooks/useTiposElemento';
import { Package } from 'lucide-react';
import { TipoElementoFormDialog } from './TipoElementoFormDialog';
import { DeleteTipoElementoDialog } from './DeleteTipoElementoDialog';
import { CatalogoCrudShell } from '@/components/common/CatalogoCrudShell';
import type { TipoElemento } from '@/lib/types/spaces';

interface TipoElementoManagementProps {
  /** Se avisa al consumidor cuando el catálogo cambió, para que recargue lo suyo. */
  onSuccess?: () => void;
}

/** Catálogo de tipos de elemento de inventario. Vive como sección de Configuración. */
export function TipoElementoManagement({
  onSuccess,
}: Readonly<TipoElementoManagementProps>) {
  const { tiposElemento, loading, refresh: refreshTiposElemento } = useTiposElemento();

  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoElemento | null>(null);

  const handleCreateClick = () => {
    setSelectedTipo(null);
    setCreateDialog(true);
  };

  const handleEditClick = (tipo: TipoElemento) => {
    setSelectedTipo(tipo);
    setEditDialog(true);
  };

  const handleDeleteClick = (tipo: TipoElemento) => {
    setSelectedTipo(tipo);
    setDeleteDialog(true);
  };

  const handleFormSuccess = () => {
    refreshTiposElemento();
    onSuccess?.();
    setCreateDialog(false);
    setEditDialog(false);
  };

  const handleDeleteSuccess = () => {
    refreshTiposElemento();
    onSuccess?.();
    setDeleteDialog(false);
  };

  return (
    <>
      <CatalogoCrudShell<TipoElemento>
        title="Tipos de inventario"
        description="Clasifican los elementos de inventario: proyector, silla, notebook."
        Icon={Package}
        loading={loading}
        items={tiposElemento}
        emptyLabel="Todavía no hay tipos de inventario"
        createLabel="Crear tipo"
        onCreate={handleCreateClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      <TipoElementoFormDialog
        tipoElemento={null}
        open={createDialog}
        onOpenChange={setCreateDialog}
        onSuccess={handleFormSuccess}
      />

      <TipoElementoFormDialog
        tipoElemento={selectedTipo}
        open={editDialog}
        onOpenChange={setEditDialog}
        onSuccess={handleFormSuccess}
      />

      <DeleteTipoElementoDialog
        tipoElemento={selectedTipo}
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}
