import { useState } from 'react';
import { useTiposElemento } from '@/hooks/useTiposElemento';
import { Package } from 'lucide-react';
import { TipoElementoFormDialog } from './TipoElementoFormDialog';
import { DeleteTipoElementoDialog } from './DeleteTipoElementoDialog';
import { TipoCrudShell } from '@/components/common/TipoCrudShell';
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
      <TipoCrudShell<TipoElemento>
        variant="inline"
        title="Tipos de inventario"
        description="Administra los tipos de elementos de inventario disponibles. Puedes crear, editar y desactivar tipos."
        loading={loading}
        items={tiposElemento}
        loadingLabel="Cargando tipos de inventario..."
        emptyLabel="No hay tipos de inventario disponibles"
        EmptyIcon={Package}
        renderRowLeading={() => (
          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
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
