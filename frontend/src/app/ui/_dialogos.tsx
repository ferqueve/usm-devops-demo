import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { MARCA } from '@/lib/design/paleta';

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

/**
 * Los diálogos del sistema, abriéndose de verdad.
 *
 * Van con un botón y no incrustados porque un diálogo se monta en un portal
 * sobre el <body>: sale del panel de tema del catálogo y toma el tema global
 * de la aplicación. Es además como se usan —uno por vez, tapando la pantalla—,
 * así que verlos de a uno no es una limitación sino la forma correcta.
 *
 * Lo que salta al verlos juntos: los ocho «Delete…Dialog» tienen exactamente
 * la misma firma —{ entidad, open, onOpenChange, onSuccess }— y difieren en el
 * nombre del prop y en una frase de texto. Son ~690 líneas haciendo lo mismo.
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
const item = {
  id: 1, nombre: 'Proyector Epson X41', codigo: 'INV-0041', cantidad: 3,
  estado: 'DISPONIBLE', espacioNombre: 'Aula 8',
} as never;
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
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{nota}</p>
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
            ocho archivos, la misma firma, ~690 líneas
          </span>
        </p>
        <div className="grid gap-2 @md:grid-cols-2 @3xl:grid-cols-4 @7xl:grid-cols-6">
          <Abridor label="Carrera" nota="DeleteCarreraDialog · 77 líneas"
            render={(p) => <DeleteCarreraDialog {...p} carrera={carrera} onSuccess={noop} />} />
          <Abridor label="Materia" nota="DeleteMateriaDialog · 77 líneas"
            render={(p) => <DeleteMateriaDialog {...p} materia={materia} onSuccess={noop} />} />
          <Abridor label="Evento" nota="DeleteEventoDialog · 79 líneas"
            render={(p) => <DeleteEventoDialog {...p} evento={evento} onSuccess={noop} />} />
          <Abridor label="Espacio" nota="DeleteSpaceDialog · 95 líneas"
            render={(p) => <DeleteSpaceDialog {...p} espacio={espacio} onSuccess={noop} />} />
          <Abridor label="Tipo de espacio" nota="DeleteTipoEspacioDialog · 101 líneas"
            render={(p) => <DeleteTipoEspacioDialog {...p} tipoEspacio={tipoEspacio} onSuccess={noop} />} />
          <Abridor label="Tipo de elemento" nota="DeleteTipoElementoDialog · 100 líneas"
            render={(p) => <DeleteTipoElementoDialog {...p} tipoElemento={tipoElemento} onSuccess={noop} />} />
          <Abridor label="Item de inventario" nota="DeleteInventoryDialog · 77 líneas"
            render={(p) => <DeleteInventoryDialog {...p} item={item} onSuccess={noop} />} />
          <Abridor label="Inventario del espacio" nota="DeleteInventarioDialog · 82 líneas"
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

      <p className="text-[11px] text-muted-foreground">
        Los diálogos que piden datos al abrirse —ReservationFormDialog,
        SpaceFormDialog, MateriaFormDialog, EventoFormDialog, TutoriaFormDialog,
        InventoryFormDialog, InventarioFormDialog, AddInscriptoDialog, InscriptosDialog,
        NotificarDialog, AssignSpaceDialog, RecursoUploadDialog— no están: el catálogo
        tiene que abrir sin backend.
      </p>
    </div>
  );
}
