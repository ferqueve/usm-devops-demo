import { useState, useEffect } from 'react';
import { espaciosApi } from '@/lib/api/spaces';
import type { TipoEspacio } from '@/lib/types/spaces';
import { Palette } from 'lucide-react';
import { toast } from 'sonner';
import { TipoEspacioFormDialog } from './TipoEspacioFormDialog';
import { DeleteTipoEspacioDialog } from './DeleteTipoEspacioDialog';
import { CatalogoCrudShell } from '@/components/common/CatalogoCrudShell';
import { MARCA } from '@/lib/design/paleta';

interface TipoEspacioManagementProps {
  /** Se avisa al consumidor cuando el catálogo cambió, para que recargue lo suyo. */
  onSuccess?: () => void;
}

/** Catálogo de tipos de espacio. Vive como sección de Configuración. */
export function TipoEspacioManagement({
  onSuccess,
}: Readonly<TipoEspacioManagementProps>) {
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
  const [loading, setLoading] = useState(false);

  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoEspacio | null>(null);

  useEffect(() => {
    fetchTiposEspacio();
  }, []);

  const fetchTiposEspacio = async () => {
    try {
      setLoading(true);
      const response = await espaciosApi.listarTiposEspacio();
      setTiposEspacio(response.data || []);
    } catch (error) {
      console.error('Error al cargar tipos de espacio:', error);
      toast.error('Error al cargar tipos de espacio');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setSelectedTipo(null);
    setCreateDialog(true);
  };

  const handleEditClick = (tipo: TipoEspacio) => {
    setSelectedTipo(tipo);
    setEditDialog(true);
  };

  const handleDeleteClick = (tipo: TipoEspacio) => {
    setSelectedTipo(tipo);
    setDeleteDialog(true);
  };

  const handleFormSuccess = () => {
    fetchTiposEspacio();
    onSuccess?.();
    setCreateDialog(false);
    setEditDialog(false);
  };

  const handleDeleteSuccess = () => {
    fetchTiposEspacio();
    onSuccess?.();
    setDeleteDialog(false);
  };

  return (
    <>
      <CatalogoCrudShell<TipoEspacio>
        title="Tipos de espacios"
        description="Clasifican los espacios: aula, laboratorio, sala de reunión."
        Icon={Palette}
        accentColor={MARCA.azul}
        loading={loading}
        items={tiposEspacio}
        emptyLabel="Todavía no hay tipos de espacio"
        createLabel="Crear tipo"
        renderRowLeading={(tipo) => (
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: tipo.color || '#3B82F6' }}
          />
        )}
        onCreate={handleCreateClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      <TipoEspacioFormDialog
        tipoEspacio={null}
        open={createDialog}
        onOpenChange={setCreateDialog}
        onSuccess={handleFormSuccess}
      />

      <TipoEspacioFormDialog
        tipoEspacio={selectedTipo}
        open={editDialog}
        onOpenChange={setEditDialog}
        onSuccess={handleFormSuccess}
      />

      <DeleteTipoEspacioDialog
        tipoEspacio={selectedTipo}
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}
