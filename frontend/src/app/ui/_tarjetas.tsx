import type { ReactNode } from 'react';

import { MARCA } from '@/lib/design/paleta';
import { SpaceCard } from '@/components/spaces/SpaceCard';
import { SpaceCardSkeleton } from '@/components/spaces/SpaceCardSkeleton';
import { EventoCardDescubrir, EstadoBadge as EstadoEvento } from '@/components/eventos/EventoCardDescubrir';
import { ProximoEventoHero } from '@/components/eventos/ProximoEventoHero';
import { TutoriaCard } from '@/components/tutorias/TutoriaCard';
import { RecomendacionCard } from '@/components/recomendaciones/RecomendacionCard';
import InventoryStatsCards from '@/components/inventory/InventoryStatsCards';
import BulkActionsBar from '@/components/inventory/BulkActionsBar';
import { ViewModeToggle, FullScreenToggle, ReservationListPagination } from '@/components/reservations/_shared/ReservationListChrome';

/**
 * Las tarjetas y controles con los que se listan las cosas del sistema.
 *
 * Es donde más se nota que cada módulo resolvió lo suyo por su cuenta: la
 * tarjeta de espacio, la de evento y la de tutoría muestran lo mismo —título,
 * cuándo, dónde, cuánto lugar queda— y ninguna comparte nada con las otras.
 */

const noop = () => {};

function Caja({ titulo, nota, ancho, children }: Readonly<{
  titulo: string; nota?: string; ancho?: 'doble' | 'todo'; children: ReactNode;
}>) {
  const span = ancho ? '@md:col-span-2' : '';
  return (
    <div className={`min-w-0 rounded-lg border border-border bg-card p-3 ${span}`}>
      <p className="text-xs font-medium text-foreground">{titulo}</p>
      {nota && <p className="text-2xs leading-snug text-muted-foreground">{nota}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const espacio = {
  id: 1,
  nombre: 'Laboratorio Mecatrónica',
  capacidad: 25,
  estado: 'DISPONIBLE',
  edificioNombre: 'Edificio C',
  tipoEspacioNombre: 'Laboratorio',
  tipoEspacioColor: MARCA.verde,
  imagenUrl: null,
  imagenThumbUrl: null,
} as never;

const espacioMantenimiento = {
  ...(espacio as object),
  id: 2,
  nombre: 'Aula teórica 4',
  estado: 'MANTENIMIENTO',
  capacidad: 30,
  tipoEspacioNombre: 'Aula teórica',
  tipoEspacioColor: MARCA.azul,
} as never;

const evento = {
  id: 1,
  titulo: 'Hackathon de Datos',
  tipo: 'EVENTO',
  estado: 'PUBLICADO',
  inicio: '2026-09-20T19:00:00',
  fin: '2026-09-20T23:00:00',
  espacioNombre: 'Anfiteatro',
  cupo: 100,
  plazasDisponibles: 26,
  tags: 'datos,ia,concurso',
  patron: 'circuito',
} as never;

const eventoLleno = {
  ...(evento as object),
  id: 2,
  titulo: 'Charla: Energías Renovables',
  tipo: 'CHARLA',
  inicio: '2026-09-22T18:30:00',
  fin: '2026-09-22T20:00:00',
  espacioNombre: 'Aula 8',
  cupo: 30,
  plazasDisponibles: 0,
  tags: 'energia,sostenibilidad',
  patron: 'aurora',
} as never;

const tutoria = {
  id: 1,
  materiaNombre: 'Cálculo I',
  docenteNombre: 'Docente Nueve',
  espacioNombre: 'Aula 9',
  inicio: '2026-09-18T18:30:00',
  fin: '2026-09-18T19:30:00',
  cupo: 20,
  plazasDisponibles: 9,
  modalidad: 'PRESENCIAL',
  enVivo: false,
  enlace: null,
  tags: 'integrales,parcial',
  ratingPromedio: 4.6,
  ratingTotal: 18,
  reservaConfirmada: false,
  reservaEstado: null,
  reservaTemario: null,
} as never;

const recomendacion = {
  tipoRecomendacion: 'ESPACIO',
  puntaje: 0.87,
  razon: 'Coincide con la capacidad pedida y estuvo libre las últimas tres semanas en esa franja.',
  metadata: { espacioNombre: 'Aula teórica 4', capacidad: 30 },
} as never;

const EVENTOS_SEMANA = [
  evento,
  eventoLleno,
  { ...(evento as object), id: 3, titulo: 'Taller de Impresión 3D', inicio: '2026-09-19T14:00:00', fin: '2026-09-19T17:00:00', tipo: 'CURSO' } as never,
];


export function TarjetasDominio() {
  return (
    <div className="grid gap-3 @md:grid-cols-2 @5xl:grid-cols-3">
      <Caja titulo="SpaceCard" nota="Disponible y en mantenimiento, más su esqueleto de carga.">
        <div className="space-y-2">
          <SpaceCard espacio={espacio} onEdit={noop} />
          <SpaceCard espacio={espacioMantenimiento} onEdit={noop} enCurso />
          <SpaceCardSkeleton />
        </div>
      </Caja>

      <Caja titulo="EventoCardDescubrir" nota="Con lugar y agotado. El fondo lo elige el campo `patron`.">
        <div className="space-y-2">
          <EventoCardDescubrir evento={evento} onNavigate={noop} onInscribirse={noop} />
          <EventoCardDescubrir evento={eventoLleno} onNavigate={noop} yaInscrito />
        </div>
      </Caja>

      <Caja titulo="TutoriaCard" nota="Las tres variantes con las que se usa.">
        <div className="space-y-2">
          <TutoriaCard tutoria={tutoria} variant="disponible" onAgendar={noop} />
          <TutoriaCard tutoria={tutoria} variant="agendada" yaAgendada onCancelar={noop} />
          <TutoriaCard tutoria={tutoria} variant="docente" esMiMateria />
        </div>
      </Caja>

      <Caja titulo="RecomendacionCard" nota="Puntaje y por qué lo recomienda.">
        <RecomendacionCard recomendacion={recomendacion} onSelect={noop} />
      </Caja>

      <Caja titulo="Estado de evento" nota="EstadoBadge, exportado desde EventoCardDescubrir.">
        <div className="flex flex-wrap gap-1.5">
          {(['BORRADOR', 'PUBLICADO', 'CANCELADO', 'FINALIZADO'] as const).map((e) => (
            <EstadoEvento key={e} estado={e as never} />
          ))}
        </div>
      </Caja>

      <Caja titulo="Controles de lista" nota="Vista, pantalla completa y paginado de Reservas.">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ViewModeToggle viewMode="table" onViewModeChange={noop} />
            <FullScreenToggle isFullScreen={false} onToggle={noop} />
          </div>
          <ReservationListPagination page={2} totalPages={7} onPageChange={noop} />
        </div>
      </Caja>

      <Caja titulo="ProximoEventoHero" nota="El destacado de la pantalla de Eventos." ancho="doble">
        <ProximoEventoHero eventos={EVENTOS_SEMANA} />
      </Caja>



      <Caja titulo="InventoryStatsCards" nota="Otra tira de métricas más, la sexta del sistema." ancho="doble">
        <InventoryStatsCards
          statistics={{ totalItems: 51, disponibles: 38, mantenimiento: 7, danados: 3, sinAsignar: 3 }}
        />
      </Caja>

      <Caja titulo="BulkActionsBar" nota="Aparece al seleccionar filas.">
        <BulkActionsBar
          selectedCount={4}
          onBulkStateChange={noop}
          onBulkAssign={noop}
          onBulkUnassign={noop}
          onBulkExport={noop}
          onClearSelection={noop}
        />
      </Caja>
    </div>
  );
}
