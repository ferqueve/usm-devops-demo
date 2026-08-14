import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import type { Permission } from '@/lib/config/permissions';

export interface TipoFormBaseValues {
  nombre: string;
  descripcion: string;
}

interface TipoFormDialogShellProps<TValues extends TipoFormBaseValues, TEntity> {
  /** Existing entity when editing; null when creating. */
  entity: TEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (saved: TEntity) => void;
  /** Singular label, e.g. "tipo de elemento". Used in titles and toasts. */
  entityLabel: string;
  /** Capitalized variant for titles, e.g. "Tipo de Elemento". */
  entityLabelTitle: string;
  /** Placeholder for the nombre input. */
  nombrePlaceholder: string;
  /** Placeholder for the descripción textarea. */
  descripcionPlaceholder: string;
  /** Map an entity to form values when entering edit mode. */
  toFormValues: (entity: TEntity) => TValues;
  /** Initial blank values when creating. */
  initialValues: TValues;
  /** Submit function: receives current values and editing flag, returns the saved entity. */
  onSubmit: (values: TValues, editing: boolean) => Promise<TEntity | null>;
  /** Optional extra fields rendered after the descripción field. */
  renderExtraFields?: (
    values: TValues,
    setValues: React.Dispatch<React.SetStateAction<TValues>>,
    loading: boolean,
  ) => React.ReactNode;
  /** Permission keys for the save button (defaults to "tipo:editar" / "tipo:crear"). */
  permissions?: { crear?: Permission; editar?: Permission };
}

/**
 * Generic form dialog for "tipo" entities (TipoElemento, TipoEspacio).
 * Renders shared chrome (header/footer, nombre, descripción) and lets
 * each consumer plug in extra fields and the submit logic.
 */
export function TipoFormDialogShell<TValues extends TipoFormBaseValues, TEntity>({
  entity,
  open,
  onOpenChange,
  onSuccess,
  entityLabel,
  entityLabelTitle,
  nombrePlaceholder,
  descripcionPlaceholder,
  toFormValues,
  initialValues,
  onSubmit,
  renderExtraFields,
  permissions,
}: Readonly<TipoFormDialogShellProps<TValues, TEntity>>) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TValues>(initialValues);

  const isEditing = !!entity;
  const crearPerm = permissions?.crear ?? 'tipo:crear';
  const editarPerm = permissions?.editar ?? 'tipo:editar';

  // Hold latest values/converter in refs so the effect can depend solely on
  // the entity identity (avoiding spurious resets when callers pass inline
  // arrow functions).
  const toFormValuesRef = useRef(toFormValues);
  const initialValuesRef = useRef(initialValues);
  toFormValuesRef.current = toFormValues;
  initialValuesRef.current = initialValues;

  useEffect(() => {
    if (entity) {
      setFormData(toFormValuesRef.current(entity));
    } else {
      setFormData(initialValuesRef.current);
    }
  }, [entity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre?.trim()) {
      toast.error(`El nombre del ${entityLabel} es requerido`);
      return;
    }

    try {
      setLoading(true);
      const saved = await onSubmit(formData, isEditing);

      toast.success(
        isEditing
          ? `${entityLabelTitle} actualizado`
          : `${entityLabelTitle} creado`,
        {
          description: `${formData.nombre} ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente`,
        },
      );

      if (saved) {
        onSuccess(saved);
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `No se pudo guardar el ${entityLabel}`;
      console.error(`Error al guardar ${entityLabel}:`, error);
      toast.error(
        isEditing
          ? `Error al actualizar ${entityLabel}`
          : `Error al crear ${entityLabel}`,
        { description: errorMessage },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Editar ${entityLabelTitle}`
              : `Crear Nuevo ${entityLabelTitle}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Modifica la información del ${entityLabel} seleccionado.`
              : `Completa la información para crear un nuevo ${entityLabel}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] -mx-6 px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Tipo</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder={nombrePlaceholder}
                disabled={loading}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (Opcional)</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descripcion: e.target.value,
                  }))
                }
                placeholder={descripcionPlaceholder}
                disabled={loading}
                rows={3}
                className="w-full"
              />
            </div>

            {renderExtraFields?.(formData, setFormData, loading)}
          </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <PermissionGuard
            requiredPermissions={isEditing ? [editarPerm] : [crearPerm]}
          >
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </PermissionGuard>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
