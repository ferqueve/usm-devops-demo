import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { espaciosApi } from '@/lib/api/spaces';
import type { TipoEspacio } from '@/lib/types/spaces';
import {
  TipoFormDialogShell,
  type TipoFormBaseValues,
} from '@/components/common/TipoFormDialogShell';

interface TipoEspacioFormValues extends TipoFormBaseValues {
  color: string;
}

interface TipoEspacioFormDialogProps {
  tipoEspacio: TipoEspacio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tipoEspacio: TipoEspacio) => void;
}

const INITIAL_VALUES: TipoEspacioFormValues = {
  nombre: '',
  descripcion: '',
  color: '',
};

export function TipoEspacioFormDialog({
  tipoEspacio,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<TipoEspacioFormDialogProps>) {
  return (
    <TipoFormDialogShell<TipoEspacioFormValues, TipoEspacio>
      entity={tipoEspacio}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      entityLabel="tipo de espacio"
      entityLabelTitle="Tipo de Espacio"
      nombrePlaceholder="Ej: Aula, Laboratorio, Salón"
      descripcionPlaceholder="Descripción del tipo de espacio..."
      initialValues={INITIAL_VALUES}
      toFormValues={(entity) => ({
        nombre: entity.nombre,
        descripcion: entity.descripcion || '',
        color: entity.color || '',
      })}
      onSubmit={async (values, editing) => {
        const data = {
          nombre: values.nombre.trim(),
          descripcion: values.descripcion.trim() || undefined,
          color: values.color.trim() || undefined,
        };

        const response =
          editing && tipoEspacio
            ? await espaciosApi.actualizarTipoEspacio(tipoEspacio.id, data)
            : await espaciosApi.crearTipoEspacio(data);

        return response.data ?? null;
      }}
      renderExtraFields={(values, setValues, loading) => (
        <div className="space-y-2">
          <Label htmlFor="color">Color (Opcional)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="color"
              type="color"
              value={values.color || '#3B82F6'}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, color: e.target.value }))
              }
              disabled={loading}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={values.color}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, color: e.target.value }))
              }
              placeholder="#3B82F6"
              disabled={loading}
              className="flex-1"
              pattern="^#[0-9A-F]{6}$"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Deja en blanco para generar un color automáticamente
          </p>
        </div>
      )}
    />
  );
}
