import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { espaciosApi } from '@/lib/api/spaces';
import type { TipoEspacio } from '@/lib/types/spaces';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { TipoEspacioFormDialog } from './TipoEspacioFormDialog';
import { DeleteTipoEspacioDialog } from './DeleteTipoEspacioDialog';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface TipoEspacioManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TipoEspacioManagement({ 
  open, 
  onOpenChange, 
  onSuccess 
}: TipoEspacioManagementProps) {
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para modales
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoEspacio | null>(null);

  // Cargar tipos
  useEffect(() => {
    if (open) {
      fetchTiposEspacio();
    }
  }, [open]);

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
    onSuccess();
    setCreateDialog(false);
    setEditDialog(false);
  };

  const handleDeleteSuccess = () => {
    fetchTiposEspacio();
    onSuccess();
    setDeleteDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Gestionar Tipos de Espacios</DialogTitle>
            <DialogDescription>
              Administra los tipos de espacios disponibles. Puedes crear, editar y desactivar tipos.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Cargando tipos de espacios...</p>
              </div>
            ) : tiposEspacio.length === 0 ? (
              <div className="text-center py-8">
                <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay tipos de espacios disponibles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tiposEspacio.map((tipo) => (
                  <div
                    key={tipo.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tipo.color || '#3B82F6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{tipo.nombre}</h3>
                        {tipo.descripcion && (
                          <p className="text-xs text-muted-foreground truncate">{tipo.descripcion}</p>
                        )}
                      </div>
                      {!tipo.activo && (
                        <Badge variant="secondary" className="text-xs">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <PermissionGuard requiredPermission="tipos_espacio:editar">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(tipo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard requiredPermission="tipos_espacio:eliminar">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(tipo)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <PermissionGuard requiredPermission="tipos_espacio:crear">
              <Button onClick={handleCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Tipo
              </Button>
            </PermissionGuard>
          </div>
        </DialogContent>
      </Dialog>

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

