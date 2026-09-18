import type { ReactNode } from 'react';
import { Award, Boxes, CalendarDays, Inbox } from 'lucide-react';

import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';
import { MARCA } from '@/lib/design/paleta';

import { AdminDashboard } from '@/components/dashboard/views/AdminDashboard';
import { AnalistaDashboard } from '@/components/dashboard/views/AnalistaDashboard';
import { DocenteDashboard } from '@/components/dashboard/views/DocenteDashboard';
import { EstudianteDashboard } from '@/components/dashboard/views/EstudianteDashboard';
import { ExternoDashboard } from '@/components/dashboard/views/ExternoDashboard';
import { MantenimientoDashboard } from '@/components/dashboard/views/MantenimientoDashboard';

import { Hero } from '@/components/dashboard/views/_components/Hero';
import { Section } from '@/components/dashboard/views/_components/Section';
import { DualPanel } from '@/components/dashboard/views/_components/DualPanel';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import UpcomingReservations from '@/components/dashboard/UpcomingReservations';
import StatsListWidget from '@/components/dashboard/widgets/_shared/StatsListWidget';
import InventoryStatsWidget from '@/components/dashboard/widgets/InventoryStatsWidget';
import SpaceStatsWidget from '@/components/dashboard/widgets/SpaceStatsWidget';
import PriorityReservationsWidget from '@/components/dashboard/widgets/PriorityReservationsWidget';
import PendingReservationsAlert from '@/components/dashboard/widgets/PendingReservationsAlert';
import PendingInventoryRequestsAlert from '@/components/dashboard/widgets/PendingInventoryRequestsAlert';

import { DASHBOARD, RESERVAS_PENDIENTES, RESERVAS_PROXIMAS } from './_datos-dashboard';

/**
 * Los seis dashboards por rol y los catorce bloques con que se arman.
 *
 * Los seis reciben el mismo `DashboardData` y cada uno saca lo suyo, así que
 * verlos apilados muestra de una sola pasada qué ve cada rol al entrar —y
 * cuánto se repite entre ellos.
 *
 * Cada uno se envuelve en un alto fijo: están pensados para ocupar la pantalla
 * completa y sin acotarlos empujarían el catálogo a decenas de miles de
 * píxeles.
 */

const noop = () => {};

function Caja({ titulo, nota, ancho, children }: Readonly<{
  titulo: string; nota?: string; ancho?: boolean; children: ReactNode;
}>) {
  return (
    <div className={`min-w-0 rounded-lg border border-border bg-card p-3 ${ancho ? '@md:col-span-2' : ''}`}>
      <p className="text-xs font-medium text-foreground">{titulo}</p>
      {nota && <p className="text-[11px] leading-snug text-muted-foreground">{nota}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

/**
 * Marco del alto de una pantalla real.
 *
 * Los dashboards se arman con `lg:h-full` y filas de grilla, así que reparten
 * el alto que les den. En un marco de 520 px esas filas se quedaban sin
 * espacio y los paneles mostraban 24 px de 317: se veía el título y nada más.
 * 880 es lo que mide el área útil de una pantalla de trabajo, y con eso el
 * dashboard se acomoda igual que en la aplicación.
 */
function Pantalla({ titulo, nota, children }: Readonly<{
  titulo: string; nota: string; children: ReactNode;
}>) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs font-medium text-foreground">{titulo}</p>
      <p className="mb-2 text-[11px] leading-snug text-muted-foreground">{nota}</p>
      <div className="h-[880px] overflow-hidden rounded-md bg-background p-2">{children}</div>
    </div>
  );
}

const PRIORITARIAS: RecomendacionAnalista[] = [
  { reservaId: 21, docenteNombre: 'Docente Quince', espacioId: 11, urgencia: 9 } as RecomendacionAnalista,
  { reservaId: 23, docenteNombre: 'Docente Tres', espacioId: 3, urgencia: 8 } as RecomendacionAnalista,
  { reservaId: 25, docenteNombre: 'Docente Nueve', espacioId: 4, urgencia: 7 } as RecomendacionAnalista,
];

const ESPACIOS_STATS = { totalEspacios: 13, disponibles: 13, enMantenimiento: 0, ocupados: 4 };

export function Dashboards() {
  return (
    <div className="space-y-3">
      <Pantalla titulo="AdminDashboard" nota="Lo que ve un administrador: cola, sistema y actividad.">
        <AdminDashboard
          data={DASHBOARD}
          loading={false}
          reservasPrioritarias={PRIORITARIAS}
          reservasPendientes={RESERVAS_PENDIENTES}
          loadingPrioritarias={false}
          pendingInventoryRequests={7458}
          onViewDetails={noop}
        />
      </Pantalla>

      <Pantalla titulo="AnalistaDashboard" nota="Quien aprueba: la cola y lo que resolvió.">
        <AnalistaDashboard
          data={DASHBOARD}
          loading={false}
          reservasPrioritarias={PRIORITARIAS}
          reservasPendientes={RESERVAS_PENDIENTES}
          loadingPrioritarias={false}
          onViewDetails={noop}
        />
      </Pantalla>

      <Pantalla titulo="DocenteDashboard" nota="Sus materias, sus tutorías y sus reservas.">
        <DocenteDashboard data={DASHBOARD} loading={false} misReservas={RESERVAS_PROXIMAS.slice(0, 5)} onViewDetails={noop} />
      </Pantalla>

      <Pantalla titulo="EstudianteDashboard" nota="Materias que cursa, tutorías agendadas y eventos.">
        <EstudianteDashboard data={DASHBOARD} loading={false} onViewDetails={noop} />
      </Pantalla>

      <Pantalla titulo="ExternoDashboard" nota="Alguien de afuera: sólo sus reservas y los eventos abiertos.">
        <ExternoDashboard data={DASHBOARD} loading={false} misReservas={RESERVAS_PROXIMAS.slice(0, 3)} onViewDetails={noop} />
      </Pantalla>

      <Pantalla titulo="MantenimientoDashboard" nota="Inventario a reparar y espacios fuera de servicio.">
        <MantenimientoDashboard
          data={DASHBOARD}
          loading={false}
          inventarioStats={null}
          espaciosStats={ESPACIOS_STATS}
          pendingInventoryRequests={7458}
        />
      </Pantalla>

      <div className="grid gap-3 @md:grid-cols-2 @5xl:grid-cols-3">
        <Caja titulo="Hero" nota="El titular de cada dashboard. El fondo lo elige `patron`." ancho>
          <div className="space-y-2">
            <Hero
              etiqueta="LO QUE HAY QUE ATENDER"
              titulo="4.678 reservas por aprobar"
              detalle="Aula 8 concentra 396 · 7458 solicitudes de inventario · sistema DOWN"
              icono={Inbox}
              patron="nodos"
              foco={{ valor: '67%', leyenda: 'aprobación' }}
              accion={{ label: 'Ir a la cola', to: '/reservations' }}
            />
            <Hero
              etiqueta="TU PRÓXIMA CLASE"
              titulo="Programación I"
              detalle="Aula 8 · 20:00 · 34 inscriptos"
              icono={CalendarDays}
              cuandoISO={`2026-09-17T20:00:00`}
              accion={{ label: 'Ver materia', to: '/materias' }}
            />
          </div>
        </Caja>

        <Caja titulo="Section" nota="Título con conteo y enlace.">
          <Section title="Mis materias" count={4} action={{ label: 'ver todas', to: '/materias' }}>
            <p className="text-xs text-muted-foreground">El contenido va acá.</p>
          </Section>
        </Caja>

        <Caja titulo="DualPanel" nota="Dos paneles con proporción fija.">
          <DualPanel
            ratio="3/2"
            left={{ title: 'Izquierda', body: <p className="text-xs text-muted-foreground">3 partes</p> }}
            right={{ title: 'Derecha', body: <p className="text-xs text-muted-foreground">2 partes</p> }}
          />
        </Caja>

        <Caja titulo="QuickActions" nota="Atajos del dashboard.">
          <QuickActions />
        </Caja>

        <Caja titulo="DashboardStats" nota="La tira vieja del dashboard: otra implementación más." ancho>
          <DashboardStats stats={DASHBOARD.stats} />
        </Caja>

        <Caja titulo="DashboardCharts" nota="Los gráficos del dashboard anterior." ancho>
          <DashboardCharts reservas={RESERVAS_PROXIMAS} stats={DASHBOARD.reservaStats} />
        </Caja>

        <Caja titulo="UpcomingReservations" nota="Próximas, con filtro de sólo las mías." ancho>
          <UpcomingReservations reservas={RESERVAS_PROXIMAS} onViewDetails={noop} onToggleFilter={noop} />
        </Caja>

        <Caja titulo="StatsListWidget" nota="Lista de métricas con icono y color.">
          <StatsListWidget
            title="Resumen académico"
            TitleIcon={Award}
            loading={false}
            items={[
              { label: 'Materias', value: 4, icon: Award, color: MARCA.azul },
              { label: 'Créditos', value: 44, icon: Award, color: MARCA.verde },
              { label: 'Tutorías', value: 3, icon: CalendarDays, color: MARCA.naranja },
              { label: 'Racha', value: 5, icon: Boxes, color: MARCA.amarillo },
            ]}
          />
        </Caja>

        <Caja titulo="SpaceStatsWidget" nota="Resumen del parque de espacios.">
          <SpaceStatsWidget stats={ESPACIOS_STATS} loading={false} />
        </Caja>

        <Caja titulo="InventoryStatsWidget" nota="Con stats en null no dibuja nada: no tiene estado vacío, queda un hueco mudo.">
          <InventoryStatsWidget stats={null} loading={false} />
        </Caja>

        <Caja titulo="PriorityReservationsWidget" nota="Cola ordenada por urgencia.">
          <PriorityReservationsWidget
            reservasPrioritarias={PRIORITARIAS}
            reservasPendientes={RESERVAS_PENDIENTES}
            loading={false}
            canApprove
            onViewDetails={noop}
          />
        </Caja>

        <Caja titulo="Avisos" nota="Las dos alertas del dashboard.">
          <div className="space-y-2">
            <PendingReservationsAlert count={4678} loading={false} canApprove />
            <PendingInventoryRequestsAlert count={7458} />
          </div>
        </Caja>
      </div>
    </div>
  );
}
