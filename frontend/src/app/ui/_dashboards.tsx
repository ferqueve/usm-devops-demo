import type { ReactNode } from 'react';
import { CalendarDays, Inbox } from 'lucide-react';

import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';

import { AdminDashboard } from '@/components/dashboard/views/AdminDashboard';
import { AnalistaDashboard } from '@/components/dashboard/views/AnalistaDashboard';
import { DocenteDashboard } from '@/components/dashboard/views/DocenteDashboard';
import { EstudianteDashboard } from '@/components/dashboard/views/EstudianteDashboard';
import { ExternoDashboard } from '@/components/dashboard/views/ExternoDashboard';
import { MantenimientoDashboard } from '@/components/dashboard/views/MantenimientoDashboard';

import { Hero } from '@/components/dashboard/views/_components/Hero';

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
      {nota && <p className="text-2xs leading-snug text-muted-foreground">{nota}</p>}
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
      <p className="mb-2 text-2xs leading-snug text-muted-foreground">{nota}</p>
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











      </div>
    </div>
  );
}
