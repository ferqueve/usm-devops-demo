import { inventarioApi } from '@/lib/api/inventory';
import type { TipoElemento } from '@/lib/types/spaces';
import {
  TipoFormDialogShell,
  type TipoFormBaseValues,
} from '@/components/common/TipoFormDialogShell';

interface TipoElementoFormDialogProps {
  tipoElemento: TipoElemento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tipoElemento: TipoElemento) => void;
}

const INITIAL_VALUES: TipoFormBaseValues = {
  nombre: '',
  descripcion: '',
};

export function TipoElementoFormDialog({
  tipoElemento,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<TipoElementoFormDialogProps>) {
  return (
    <TipoFormDialogShell<TipoFormBaseValues, TipoElemento>
      entity={tipoElemento}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      entityLabel="tipo de elemento"
      entityLabelTitle="Tipo de Elemento"
      nombrePlaceholder="Ej: Proyector, Computadora, Mesa"
      descripcionPlaceholder="Descripción del tipo de elemento..."
      initialValues={INITIAL_VALUES}
      toFormValues={(entity) => ({
        nombre: entity.nombre,
        descripcion: entity.descripcion || '',
      })}
      onSubmit={async (values, editing) => {
        const data = {
          nombre: values.nombre.trim(),
          descripcion: values.descripcion.trim() || undefined,
        };

        const response =
          editing && tipoElemento
            ? await inventarioApi.actualizarTipoElemento(tipoElemento.id, data)
            : await inventarioApi.crearTipoElemento(data);

        return response.data ?? null;
      }}
    />
  );
}
