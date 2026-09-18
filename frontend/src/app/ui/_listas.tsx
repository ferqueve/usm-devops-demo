import { useState, type ReactNode } from 'react';

import type { Espacio, InventarioItem, Reserva } from '@/lib/types/spaces';

import type { AuditLogFilters } from '@/lib/types/audit';
import { MARCA } from '@/lib/design/paleta';

import InventoryTable from '@/components/inventory/InventoryTable';
import InventoryCardView from '@/components/inventory/InventoryCardView';
import { InventoryRequestFilters } from '@/components/inventory/InventoryRequestFilters';
import InventoryRequestsCardView from '@/components/inventory/InventoryRequestsCardView';
import { EspacioCell } from '@/components/inventory/_shared/EspacioCell';
import { SpaceTable } from '@/components/spaces/SpaceTable';
import ReservationTableView from '@/components/reservations/ReservationTableView';
import ReservationCardView from '@/components/reservations/ReservationCardView';
import ReservationFilters from '@/components/reservations/ReservationFilters';
import {
  AnalistaSelect, CarreraSelect, EspacioSelect,
} from '@/components/reservations/_shared/ReservationFormSections';
import { FiltersPanel } from '@/components/common/FiltersPanel';
import { AgendaCalendario } from '@/components/agenda/AgendaCalendario';
import AuditFilters from '@/components/audit/AuditFilters';
import { TutoriasAgenda } from '@/components/tutorias/TutoriasAgenda';
import { DisponibilidadSemanal } from '@/components/tutorias/DisponibilidadSemanal';
import { ProximaTutoriaHero } from '@/components/tutorias/ProximaTutoriaHero';
import { LoginForm } from '@/components/public/auth/LoginForm';
import { EmailVerificationMessage } from '@/components/public/auth/EmailVerificationMessage';

import { RESERVAS_PENDIENTES, RESERVAS_PROXIMAS } from './_datos-dashboard';

/**
 * Las listas, tablas y barras de filtro de cada módulo.
 *
 * Juntas cuentan la misma historia que las tarjetas: inventario, reservas y
 * espacios tienen cada uno su tabla y su vista de fichas, escritas por
 * separado, con su propio orden, su propia selección múltiple y su propia
 * barra de filtros.
 */

const noop = () => {};

function Caja({ titulo, nota, ancho, children }: Readonly<{
  titulo: string; nota?: string; ancho?: boolean; children: ReactNode;
}>) {
  return (
    <div className={`min-w-0 rounded-lg border border-border bg-card p-3 ${ancho ? '@md:col-span-2' : ''}`}>
      <p className="text-xs font-medium text-foreground">{titulo}</p>
      {nota && <p className="text-2xs leading-snug text-muted-foreground">{nota}</p>}
      <div className="mt-2 overflow-auto">{children}</div>
    </div>
  );
}

const ITEMS: InventarioItem[] = [
  { id: 1, espacioId: 8, espacioNombre: 'Aula 8', espacioColor: MARCA.azul, tipoElementoId: 1, tipoElementoNombre: 'Proyector', cantidad: 1, estado: 'DISPONIBLE', activo: true, updatedAt: '2026-09-01T12:00:00', createdAt: '2026-03-02T10:00:00' },
  { id: 2, espacioId: 3, espacioNombre: 'Laboratorio Mecatrónica', espacioColor: MARCA.verde, tipoElementoId: 2, tipoElementoNombre: 'Impresora 3D', cantidad: 2, estado: 'MANTENIMIENTO', observaciones: 'Extrusor obstruido', activo: true, updatedAt: '2026-09-01T12:00:00', createdAt: '2026-04-18T09:30:00' },
  { id: 3, espacioId: null, espacioNombre: '', tipoElementoId: 3, tipoElementoNombre: 'Notebook', cantidad: 6, estado: 'DISPONIBLE', activo: true, updatedAt: '2026-09-01T12:00:00', createdAt: '2026-05-21T14:10:00' },
  { id: 4, espacioId: 1, espacioNombre: 'Anfiteatro', espacioColor: MARCA.naranja, tipoElementoId: 4, tipoElementoNombre: 'Micrófono', cantidad: 3, estado: 'DANADO', observaciones: 'Uno sin cable', activo: true, updatedAt: '2026-09-01T12:00:00', createdAt: '2026-01-09T16:45:00' },
];

const ESPACIOS: Espacio[] = [
  { id: 8, nombre: 'Aula 8', capacidad: 30, estado: 'DISPONIBLE', edificioNombre: 'Edificio A', tipoEspacioNombre: 'Aula teórica', tipoEspacioColor: MARCA.azul } as Espacio,
  { id: 3, nombre: 'Laboratorio Mecatrónica', capacidad: 25, estado: 'DISPONIBLE', edificioNombre: 'Edificio C', tipoEspacioNombre: 'Laboratorio', tipoEspacioColor: MARCA.verde } as Espacio,
  { id: 1, nombre: 'Anfiteatro', capacidad: 100, estado: 'MANTENIMIENTO', edificioNombre: 'Edificio A', tipoEspacioNombre: 'Anfiteatro', tipoEspacioColor: MARCA.naranja } as Espacio,
];

const SOLICITUDES = [
  { id: 1, reservaId: 42, tipoElementoNombre: 'Proyector', cantidadSolicitada: 1, estado: 'PENDIENTE', espacioNombre: 'Aula 8', usuarioNombre: 'Docente Quince', inicio: '2026-09-18T18:30:00' },
  { id: 2, reservaId: 43, tipoElementoNombre: 'Notebook', cantidadSolicitada: 4, estado: 'APROBADO', espacioNombre: 'Laboratorio Mecatrónica', usuarioNombre: 'Docente Tres', inicio: '2026-09-19T14:00:00' },
  { id: 3, reservaId: 44, tipoElementoNombre: 'Micrófono', cantidadSolicitada: 2, estado: 'ENTREGADO', espacioNombre: 'Anfiteatro', usuarioNombre: 'Externo Siete', inicio: '2026-09-20T19:00:00' },
] as never;

const TUTORIAS = [
  { id: 1, materiaId: 1, materiaNombre: 'Cálculo I', docenteNombre: 'Docente Nueve', espacioId: 9, espacioNombre: 'Aula 9', inicio: '2026-09-18T18:30:00', fin: '2026-09-18T19:30:00', cupo: 20, plazasDisponibles: 9, estado: 'ABIERTA' },
  { id: 2, materiaId: 2, materiaNombre: 'Programación I', docenteNombre: 'Docente Quince', espacioId: 8, espacioNombre: 'Aula 8', inicio: '2026-09-19T15:00:00', fin: '2026-09-19T16:00:00', cupo: 20, plazasDisponibles: 2, estado: 'ABIERTA' },
  { id: 3, materiaId: 3, materiaNombre: 'Machine Learning', docenteNombre: 'Docente Tres', espacioId: 3, espacioNombre: 'Laboratorio Mecatrónica', inicio: '2026-09-22T17:00:00', fin: '2026-09-22T18:30:00', cupo: 25, plazasDisponibles: 18, estado: 'ABIERTA' },
  { id: 4, materiaId: 1, materiaNombre: 'Cálculo I', docenteNombre: 'Docente Nueve', espacioId: 9, espacioNombre: 'Aula 9', inicio: '2026-09-25T18:30:00', fin: '2026-09-25T19:30:00', cupo: 20, plazasDisponibles: 20, estado: 'CERRADA' },
] as never;

const AGENDA = [
  { id: 1, fuente: 'tutoria' as const, titulo: 'Tutoría de Cálculo I', inicio: '2026-09-18T18:30:00', fin: '2026-09-18T19:30:00', lugar: 'Aula 9', estado: 'ABIERTA', href: '/materias' },
  { id: 2, fuente: 'evento' as const, titulo: 'Hackathon de Datos', inicio: '2026-09-20T19:00:00', fin: '2026-09-20T23:00:00', lugar: 'Anfiteatro', estado: 'PUBLICADO', href: '/eventos' },
  { id: 3, fuente: 'evento' as const, titulo: 'Charla: Energías Renovables', inicio: '2026-09-22T18:30:00', lugar: 'Aula 8', estado: 'PUBLICADO', href: '/eventos' },
  { id: 4, fuente: 'tutoria' as const, titulo: 'Tutoría de Programación I', inicio: '2026-09-19T15:00:00', fin: '2026-09-19T16:00:00', lugar: 'Aula 8', estado: 'ABIERTA', href: '/materias' },
];

const OPCIONES_ESPACIO = ESPACIOS.map((e) => ({ id: e.id, nombre: e.nombre, capacidad: e.capacidad }));
const OPCIONES_CARRERA = [
  { id: 1, nombre: 'Licenciatura en Tecnologías de la Información', codigo: 'LTI' },
  { id: 2, nombre: 'Ingeniería en Mecatrónica', codigo: 'IMT' },
];
const ANALISTAS = [
  { id: 1, nombre: 'Usuario Analista', email: 'analista@utec.edu.uy' },
  { id: 2, nombre: 'Analista Dos', email: 'analista2@utec.edu.uy' },
] as never;

const SIN_ORDEN = { column: 'nombre', direction: 'asc' as const };

export function ListasYFiltros() {
  const [busqueda, setBusqueda] = useState('');
  const [espacioSel, setEspacioSel] = useState<number | null>(null);
  const [filtrosAudit, setFiltrosAudit] = useState<AuditLogFilters>({});
  const [valorEspacio, setValorEspacio] = useState('8');
  const [valorCarrera, setValorCarrera] = useState('1');
  const [valorAnalista, setValorAnalista] = useState('1');

  // Las tres vistas de reservas comparten exactamente los mismos veintitantos
  // props: los filtros, sus setters y las listas de opciones. Que haga falta
  // repetirlos así es parte de lo que muestra esta sección.
  const filtros = {
    tiempoFilter: 'todas',
    estadoFilter: 'todas',
    espacioFilter: null,
    carreraFilter: null,
    tipoEspacioFilter: null,
    fechaInicio: undefined,
    fechaFin: undefined,
    espaciosUnicos: ESPACIOS,
    carrerasUnicas: OPCIONES_CARRERA as never,
    tiposEspacioUnicos: [] as never,
    hayFiltrosActivos: false,
    onTiempoFilterChange: noop,
    onEstadoFilterChange: noop,
    onEspacioFilterChange: noop,
    onCarreraFilterChange: noop,
    onTipoEspacioFilterChange: noop,
    onFechaInicioChange: noop,
    onFechaFinChange: noop,
    onClearFilters: noop,
  };
  const lista = {
    ...filtros,
    reservas: [...RESERVAS_PROXIMAS, ...RESERVAS_PENDIENTES] as Reserva[],
    viewMode: 'table' as const,
    onViewModeChange: noop,
    onCreateReserva: noop,
    onViewDetails: noop,
    onCancelReserva: noop,
  };

  return (
    <div className="grid gap-3 @md:grid-cols-2 @5xl:grid-cols-3">
      <Caja titulo="InventoryTable" nota="Tabla de inventario con selección y orden." ancho>
        <InventoryTable
          items={ITEMS}
          onEdit={noop}
          onDelete={noop}
          onAssign={noop}
          onView={noop}
          selectedItems={new Set([2])}
          onToggleSelect={noop}
          sortConfig={SIN_ORDEN}
          onSort={noop}
        />
      </Caja>

      <Caja titulo="InventoryCardView" nota="Los mismos ítems en fichas." ancho>
        <InventoryCardView
          items={ITEMS}
          onEdit={noop}
          onDelete={noop}
          onAssign={noop}
          onView={noop}
          selectedItems={new Set([2])}
          onToggleSelect={noop}
        />
      </Caja>

      <Caja titulo="EspacioCell" nota="La celda de espacio, en tabla y en ficha.">
        <div className="space-y-2">
          <EspacioCell item={ITEMS[0]} />
          <EspacioCell item={ITEMS[2]} />
          <EspacioCell item={ITEMS[1]} variant="card" />
        </div>
      </Caja>

      <Caja titulo="SpaceTable" nota="Tabla de espacios.">
        <SpaceTable espacios={ESPACIOS} onEdit={noop} onDelete={noop} sortConfig={SIN_ORDEN} onSort={noop} />
      </Caja>

      <Caja titulo="InventoryRequestFilters" nota="Barra de filtros de solicitudes." ancho>
        <InventoryRequestFilters
          searchValue={busqueda}
          activeSearch=""
          onSearchChange={setBusqueda}
          onSearchClear={() => setBusqueda('')}
          selectedEstados={['PENDIENTE'] as never}
          onToggleEstado={noop}
          onClearEstados={noop}
          espacios={ESPACIOS}
          selectedEspacio={espacioSel}
          onEspacioChange={setEspacioSel}
          onFechaDesdeChange={noop}
          onFechaHastaChange={noop}
          onResetFechas={noop}
          pageSize={25}
          onPageSizeChange={noop}
          hasFilters
          onClearFilters={noop}
          viewMode="cards"
          onViewModeChange={noop}
        />
      </Caja>

      <Caja titulo="InventoryRequestsCardView" nota="Solicitudes en fichas, en sus tres estados." ancho>
        <InventoryRequestsCardView
          requests={SOLICITUDES}
          onManage={noop}
          onDeliver={noop}
          processingRequestId={null}
          formatDateTime={(iso?: string) => (iso ? new Date(iso).toLocaleString('es-UY') : '—')}
          estadoOptions={[] as never}
          estadoLabel={{ PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', ENTREGADO: 'Entregado', RECHAZADO: 'Rechazado', DEVUELTO: 'Devuelto' } as never}
        />
      </Caja>

      <Caja titulo="ReservationTableView" nota="Reservas en tabla." ancho>
        <ReservationTableView {...lista} />
      </Caja>

      <Caja titulo="ReservationCardView" nota="Las mismas en fichas." ancho>
        <ReservationCardView {...lista} />
      </Caja>

      <Caja titulo="ReservationFilters" nota="Barra de filtros de reservas." ancho>
        <ReservationFilters {...filtros} />
      </Caja>

      <Caja titulo="Selects del formulario" nota="Espacio, carrera y analista.">
        <div className="space-y-2">
          <EspacioSelect value={valorEspacio} espaciosDisponibles={OPCIONES_ESPACIO} onChange={setValorEspacio} />
          <CarreraSelect value={valorCarrera} carreras={OPCIONES_CARRERA} onChange={setValorCarrera} />
          <AnalistaSelect value={valorAnalista} analistas={ANALISTAS} onChange={setValorAnalista} />
        </div>
      </Caja>

      <Caja titulo="FiltersPanel" nota="El panel de filtros genérico de common/.">
        <FiltersPanel
          showFilters
          fields={[
            { id: 'estado', label: 'Estado', type: 'select', value: 'PENDIENTE', options: [{ value: 'PENDIENTE', label: 'Pendiente' }, { value: 'APROBADO', label: 'Aprobado' }], onChange: noop },
            { id: 'buscar', label: 'Buscar', type: 'input', value: '', placeholder: 'Nombre o código…', onChange: noop },
            { id: 'desde', label: 'Desde', type: 'date', value: '2026-09-01', onChange: noop },
          ]}
        />
      </Caja>

      <Caja titulo="AuditFilters" nota="Filtros de auditoría.">
        <AuditFilters filters={filtrosAudit} onFiltersChange={setFiltrosAudit} onClearFilters={() => setFiltrosAudit({})} />
      </Caja>

      <Caja titulo="AgendaCalendario" nota="Tutorías y eventos en un mes." ancho>
        <AgendaCalendario items={AGENDA} />
      </Caja>

      <Caja titulo="TutoriasAgenda" nota="Las tutorías de la semana.">
        <TutoriasAgenda tutorias={TUTORIAS} />
      </Caja>

      <Caja titulo="DisponibilidadSemanal" nota="Dónde queda lugar.">
        <DisponibilidadSemanal tutorias={TUTORIAS} />
      </Caja>

      <Caja titulo="ProximaTutoriaHero" nota="El destacado, en sus dos modos." ancho>
        <div className="space-y-2">
          <ProximaTutoriaHero tutorias={TUTORIAS} modo="estudiante" />
          <ProximaTutoriaHero tutorias={TUTORIAS} modo="docente" />
        </div>
      </Caja>

      <Caja titulo="LoginForm" nota="La pantalla pública de entrada.">
        <LoginForm onLogin={async () => {}} />
      </Caja>

      <Caja titulo="EmailVerificationMessage" nota="Después de registrarse.">
        <EmailVerificationMessage onBackToLogin={noop} onResendEmail={noop} resendCooldown={42} />
      </Caja>
    </div>
  );
}
