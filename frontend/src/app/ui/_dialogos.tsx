import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { MARCA } from '@/lib/design/paleta';

import { ConfirmarBorradoDialog } from '@/components/common/ConfirmarBorradoDialog';
import { DeleteCarreraDialog } from '@/components/carreras/DeleteCarreraDialog';
import { DeleteMateriaDialog } from '@/components/materias/DeleteMateriaDialog';
import { DeleteEventoDialog } from '@/components/eventos/DeleteEventoDialog';
import { DeleteSpaceDialog } from '@/components/spaces/DeleteSpaceDialog';
import { DeleteTipoEspacioDialog } from '@/components/spaces/DeleteTipoEspacioDialog';
import { DeleteInventarioDialog } from '@/components/spaces/DeleteInventarioDialog';
import DeleteInventoryDialog from '@/components/inventory/DeleteInventoryDialog';
import { DeleteTipoElementoDialog } from '@/components/inventory/DeleteTipoElementoDialog';
import InventoryDetailsDialog from '@/components/inventory/InventoryDetailsDialog';
import { TipoElementoFormDialog } from '@/components/inventory/TipoElementoFormDialog';
import { TipoEspacioFormDialog } from '@/components/spaces/TipoEspacioFormDialog';
import ImportCSVDialog from '@/components/inventory/ImportCSVDialog';
import AuditLogDetailsDialog from '@/components/audit/AuditLogDetailsDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { ComoFuncionaDialog } from '@/components/sostenibilidad/ComoFuncionaDialog';
import type { AuditLog } from '@/lib/types/audit';
import type { InventarioItem } from '@/lib/types/spaces';

/**
 * Los diálogos del sistema, abriéndose de verdad.
 *
 * Van con un botón y no incrustados porque un diálogo se monta en un portal
 * sobre el <body>: sale del panel de tema del catálogo y toma el tema global
 * de la aplicación. Es además como se usan —uno por vez, tapando la pantalla—,
 * así que verlos de a uno no es una limitación sino la forma correcta.
 *
 * Verlos juntos acá fue lo que mostró que los ocho «Delete…Dialog» tenían la
 * misma firma —{ entidad, open, onOpenChange, onSuccess }— y diferían en el
 * nombre del prop y en una frase. Eran ~690 líneas diciendo lo mismo; hoy son
 * ocho envoltorios sobre `ConfirmarBorradoDialog`. Siguen listados de a uno
 * porque cada uno conserva su firma: lo que cambió es de dónde sale el dibujo.
 */

const noop = () => {};

/* Entidades de muestra.
   Las que el diálogo desarma campo por campo van con su tipo real: acá el log
   de auditoría arrancó con `fecha`, `valoresAnteriores` y `valoresNuevos`
   —nombres inventados— y como el `as never` calla al compilador, el error
   apareció recién en el navegador, con la página en blanco. Donde el tipo es
   grande y el diálogo sólo muestra un par de campos, el `as never` alcanza. */
const carrera = { id: 1, nombre: 'Licenciatura en Tecnologías de la Información', codigo: 'LTI' } as never;
const materia = { id: 1, nombre: 'Programación I', codigo: 'PROG1', creditos: 12 } as never;
const evento = { id: 1, titulo: 'Hackathon de Datos', inicio: '2026-09-20T19:00:00' } as never;
const espacio = { id: 1, nombre: 'Laboratorio Mecatrónica', capacidad: 25 } as never;
const tipoEspacio = { id: 1, nombre: 'Laboratorio', descripcion: 'Con equipamiento', color: MARCA.verde } as never;
const tipoElemento = { id: 1, nombre: 'Proyector', descripcion: 'Equipo audiovisual' } as never;
/* Tipado de verdad, no `as never`: la versión anterior traía `nombre` y
   `codigo`, que no existen en InventarioItem, y el diálogo mostraba el nombre
   vacío sin que nada se quejara. */
const item: InventarioItem = {
  id: 1,
  espacioId: 8,
  espacioNombre: 'Aula 8',
  tipoElementoId: 3,
  tipoElementoNombre: 'Proyector Epson X41',
  cantidad: 3,
  estado: 'DISPONIBLE',
  activo: true,
  createdAt: '2026-03-02T10:00:00Z',
  updatedAt: '2026-09-10T14:30:00Z',
};
const log: AuditLog = {
  id: 1,
  entidad: 'Reserva',
  entidadId: 42,
  accion: 'UPDATE',
  usuarioId: 1,
  usuarioNombre: 'Usuario Admin',
  usuarioEmail: 'admin@utec.edu.uy',
  timestamp: '2026-09-17T18:30:00',
  datosPrevios: '{"estado":"PENDIENTE","espacioId":8}',
  datosNuevos: '{"estado":"APROBADO","espacioId":8}',
  ipAddress: '192.168.1.24',
  httpMethod: 'PATCH',
  endpoint: '/api/v1/reservas/42',
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/122',
};
const usuario = {
  id: 1, nombre: 'Docente Quince', email: 'docente15@utec.edu.uy',
  rol: 'DOCENTE', activo: true, verificado: true,
} as never;

/** Un botón que abre su diálogo y lo mantiene montado. */
function Abridor({
  label, nota, render,
}: Readonly<{ label: string; nota: string; render: (p: { open: boolean; onOpenChange: (o: boolean) => void }) => ReactNode }>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3">
      <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setOpen(true)}>
        <span className="truncate">{label}</span>
      </Button>
      <p className="mt-1.5 text-2xs leading-snug text-muted-foreground">{nota}</p>
      {render({ open, onOpenChange: setOpen })}
    </div>
  );
}

export function Dialogos() {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium text-foreground">
          Confirmación de borrado
          <span className="ml-2 font-normal text-muted-foreground">
            ocho entradas, un solo ConfirmarBorradoDialog
          </span>
        </p>
        <div className="grid gap-2 @md:grid-cols-2 @3xl:grid-cols-4 @7xl:grid-cols-6">
          <Abridor label="La base" nota="ConfirmarBorradoDialog · lo que dibujan los ocho"
            render={(p) => (
              <ConfirmarBorradoDialog
                {...p}
                item={item}
                onSuccess={noop}
                entidad="asignación"
                nombre={(x) => x.tipoElementoNombre}
                eliminar={async () => {}}
                consecuencia="Acá se cambia cómo se ven las ocho confirmaciones de borrado."
                detalle={(x) => [
                  { etiqueta: 'Cantidad', valor: x.cantidad },
                  { etiqueta: 'Espacio', valor: x.espacioNombre },
                ]}
              />
            )} />
          <Abridor label="Carrera" nota="DeleteCarreraDialog · la carrera"
            render={(p) => <DeleteCarreraDialog {...p} carrera={carrera} onSuccess={noop} />} />
          <Abridor label="Materia" nota="DeleteMateriaDialog · la materia"
            render={(p) => <DeleteMateriaDialog {...p} materia={materia} onSuccess={noop} />} />
          <Abridor label="Evento" nota="DeleteEventoDialog · el evento"
            render={(p) => <DeleteEventoDialog {...p} evento={evento} onSuccess={noop} />} />
          <Abridor label="Espacio" nota="DeleteSpaceDialog · el espacio"
            render={(p) => <DeleteSpaceDialog {...p} espacio={espacio} onSuccess={noop} />} />
          <Abridor label="Tipo de espacio" nota="DeleteTipoEspacioDialog · el tipo · permiso tipo:eliminar"
            render={(p) => <DeleteTipoEspacioDialog {...p} tipoEspacio={tipoEspacio} onSuccess={noop} />} />
          <Abridor label="Tipo de elemento" nota="DeleteTipoElementoDialog · el tipo de elemento"
            render={(p) => <DeleteTipoElementoDialog {...p} tipoElemento={tipoElemento} onSuccess={noop} />} />
          <Abridor label="Item de inventario" nota="DeleteInventoryDialog · el item · permiso inventario:eliminar"
            render={(p) => <DeleteInventoryDialog {...p} item={item} onSuccess={noop} />} />
          <Abridor label="Inventario del espacio" nota="DeleteInventarioDialog · con detalle · permiso inventario:eliminar"
            render={(p) => <DeleteInventarioDialog {...p} inventarioItem={item} onSuccess={noop} />} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-foreground">Alta y edición</p>
        <div className="grid gap-2 @md:grid-cols-2 @3xl:grid-cols-4 @7xl:grid-cols-6">
          <Abridor label="Tipo de espacio" nota="TipoEspacioFormDialog · alta y edición"
            render={(p) => <TipoEspacioFormDialog {...p} tipoEspacio={null} onSuccess={noop} />} />
          <Abridor label="Tipo de elemento" nota="TipoElementoFormDialog · alta y edición"
            render={(p) => <TipoElementoFormDialog {...p} tipoElemento={null} onSuccess={noop} />} />
          <Abridor label="Editar usuario" nota="EditUserDialog · rol y estado"
            render={(p) => <EditUserDialog {...p} user={usuario} onSuccess={noop} />} />
          <Abridor label="Importar CSV" nota="ImportCSVDialog · carga masiva"
            render={(p) => <ImportCSVDialog {...p} onSuccess={noop} />} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-foreground">Detalle y ayuda</p>
        <div className="grid gap-2 @md:grid-cols-2 @3xl:grid-cols-4 @7xl:grid-cols-6">
          <Abridor label="Detalle de inventario" nota="InventoryDetailsDialog"
            render={(p) => <InventoryDetailsDialog {...p} item={item} />} />
          <Abridor label="Detalle de auditoría" nota="AuditLogDetailsDialog · antes y después"
            render={(p) => <AuditLogDetailsDialog {...p} log={log} />} />
          <Abridor label="Cómo funciona" nota="ComoFuncionaDialog · sostenibilidad"
            render={(p) => <ComoFuncionaDialog {...p} />} />
        </div>
      </div>

      <p className="text-2xs text-muted-foreground">
        Los diálogos que piden datos al abrirse —ReservationFormDialog,
        SpaceFormDialog, MateriaFormDialog, EventoFormDialog, TutoriaFormDialog,
        InventoryFormDialog, InventarioFormDialog, AddInscriptoDialog, InscriptosDialog,
        NotificarDialog, AssignSpaceDialog, RecursoUploadDialog— no están: el catálogo
        tiene que abrir sin backend.
      </p>
    </div>
  );
}
