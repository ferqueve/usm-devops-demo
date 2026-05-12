import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Edit, GraduationCap, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCarreras } from '@/hooks/useCarreras';
import type { Carrera } from '@/lib/types/spaces';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { CarreraFormDialog } from './CarreraFormDialog';
import { DeleteCarreraDialog } from './DeleteCarreraDialog';

interface CarrerasManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CarrerasManagement({ open, onOpenChange }: Readonly<CarrerasManagementProps>) {
  const { carreras, loading, refresh } = useCarreras();
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Carrera | null>(null);

  const activas = carreras.filter((c) => !c.deletedAt);

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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Gestionar Carreras</DialogTitle>
            <DialogDescription>
              Administra las carreras disponibles para asociar a las reservas. Soporta alta, edición y baja lógica.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
            {(() => {
              if (loading) {
                return (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                );
              }
              if (activas.length === 0) {
                return (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay carreras registradas</p>
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  {activas.map((carrera) => (
                    <div
                      key={carrera.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">{carrera.nombre}</h3>
                          {carrera.codigo && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {carrera.codigo}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <PermissionGuard requiredPermission="carrera:editar">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(carrera)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard requiredPermission="carrera:eliminar">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(carrera)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <PermissionGuard requiredPermission="carrera:crear">
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Carrera
              </Button>
            </PermissionGuard>
          </div>
        </DialogContent>
      </Dialog>

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
