import type { ReactNode } from 'react';
import { Activity, Cpu, HardDrive, Timer } from 'lucide-react';

import type { Reserva } from '@/lib/types/spaces';
import { MARCA } from '@/lib/design/paleta';
import { MetricCard } from '@/components/ui/metric-card';
import { MetricsChart } from '@/components/ui/metrics-chart';
import { ProgressRing } from '@/components/ui/progress-ring';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { FilterBar } from '@/components/ui/filter-bar';
import { ReservaRow } from '@/components/dashboard/views/_components/ReservaRow';
import { EventoFila, MateriaFila, TutoriaFila } from '@/components/dashboard/views/_components/Filas';

/**
 * Las piezas propias del dominio: las filas con las que se listan reservas,
 * materias, tutorías y eventos, y las tarjetas de la pantalla de Sistema.
 *
 * No son primitivas genéricas —una fila de reserva sabe lo que es un estado y
 * un tipo de espacio— pero se repiten en tantas pantallas que conviene poder
 * mirarlas de una sola vez. Los componentes de Sistema que traen sus propios
 * datos (LogViewer, HttpTraceTable) no están: no se pueden montar sin backend
 * y el catálogo tiene que abrir siempre.
 */

function Caja({ titulo, nota, children }: Readonly<{
  titulo: string; nota?: string; children: ReactNode;
}>) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3">
      <p className="text-xs font-medium text-foreground">{titulo}</p>
      {nota && <p className="mb-2 text-2xs leading-snug text-muted-foreground">{nota}</p>}
      <div className={nota ? '' : 'mt-2'}>{children}</div>
    </div>
  );
}

const RESERVA_BASE = {
  id: 1,
  titulo: 'Clase de Proyecto Integrador',
  inicio: '2026-09-17T20:30:00',
  fin: '2026-09-17T22:00:00',
  espacioNombre: 'Laboratorio Mecatrónica',
  capacidadEspacio: 25,
  tipoEspacioNombre: 'Laboratorio',
  tipoEspacioColor: MARCA.verde,
  usuarioId: 7,
  usuarioNombre: 'Docente Quince',
  usuarioEmail: 'docente15@utec.edu.uy',
  estado: 'APROBADO',
} as unknown as Reserva;

const reservaCon = (cambios: Partial<Reserva>) => ({ ...RESERVA_BASE, ...cambios }) as Reserva;

const SERIE_SISTEMA = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  valor: 40 + Math.round(28 * Math.sin(i / 3.2)) + (i % 4) * 3,
}));

/** Filas de reserva, materia, tutoría y evento. */
export function FilasDominio() {
  return (
    <div className="grid gap-3 @lg:grid-cols-2 @5xl:grid-cols-3">
      <Caja titulo="Fila de reserva" nota="La misma fila en sus tres estados y con acento de urgencia. El tipo Reserva no contempla RECHAZADO aunque el string existe en lib/types.">
        <div className="divide-y divide-border">
          <ReservaRow reserva={RESERVA_BASE} showEstado />
          <ReservaRow
            reserva={reservaCon({ estado: 'PENDIENTE', titulo: 'Defensa de tesis' })}
            showEstado
          />
          <ReservaRow
            reserva={reservaCon({ estado: 'CANCELADO', titulo: 'Taller práctico' })}
            showEstado
          />
          <ReservaRow
            reserva={reservaCon({ titulo: 'Hackathon' })}
            accent="urgent"
            meta="urgente"
          />
          <ReservaRow reserva={reservaCon({ titulo: 'Charla invitada' })} showAvatar />
        </div>
      </Caja>

      <Caja titulo="Filas académicas" nota="Materia, tutoría y evento. Comparten ritmo pero no componente.">
        <div className="divide-y divide-border">
          <MateriaFila
            materia={{ id: 1, codigo: 'PROG1', nombre: 'Programación I', creditos: 12, inscriptos: 34 } as never}
          />
          <TutoriaFila
            tutoria={{
              id: 1, materiaNombre: 'Cálculo I', docenteNombre: 'Docente Nueve',
              espacioNombre: 'Aula 9', inicio: '2026-09-18T18:30:00', cupo: 20, agendados: 11,
            } as never}
          />
          <EventoFila
            evento={{
              id: 1, titulo: 'Hackathon de Datos', espacioNombre: 'Anfiteatro',
              inicio: '2026-09-20T19:00:00', cupo: 100, inscriptos: 74, inscrito: true,
            } as never}
          />
        </div>
      </Caja>
    </div>
  );
}

/** Tarjetas y gráficos de la pantalla de Sistema. */
export function PiezasSistema() {
  return (
    <div className="grid gap-3 @md:grid-cols-2 @4xl:grid-cols-4 @7xl:grid-cols-5">
      <Caja titulo="MetricCard" nota="Variantes por estado.">
        <div className="space-y-2">
          <MetricCard title="Memoria JVM" value="68%" icon={Cpu} description="1.4 GB de 2 GB" progress={68} variant="warning" />
          <MetricCard title="Uptime" value="12 d" icon={Timer} description="sin reinicios" variant="success" />
        </div>
      </Caja>

      <Caja titulo="MetricCard · error" nota="Con tendencia.">
        <MetricCard
          title="Errores 5xx"
          value={23}
          icon={Activity}
          description="última hora"
          trend={{ value: 12, isPositive: false }}
          variant="error"
        />
      </Caja>

      <Caja titulo="ProgressRing" nota="Anillo de un solo valor.">
        <div className="flex flex-wrap items-center gap-4">
          <ProgressRing progress={68} showLabel />
          <ProgressRing progress={94} size={56} color={MARCA.verde} showLabel />
          <ProgressRing progress={23} size={56} color={MARCA.rojo} showLabel />
        </div>
      </Caja>

      <Caja titulo="AvatarInitials" nota="Color derivado del email, estable.">
        <div className="flex flex-wrap items-center gap-2">
          <AvatarInitials name="Usuario Admin" email="admin@utec.edu.uy" size="sm" />
          <AvatarInitials name="Docente Quince" email="docente15@utec.edu.uy" />
          <AvatarInitials name="Externo Siete" email="externo07@gmail.com" size="lg" />
          <AvatarInitials name="Mantenimiento Dos" email="mantenimiento2@utec.edu.uy" size="xl" />
        </div>
      </Caja>

      <div className="@md:col-span-2 @3xl:col-span-4">
        <Caja titulo="MetricsChart" nota="Serie en vivo de la pantalla de Sistema.">
          <div className="grid gap-3 @lg:grid-cols-2 @5xl:grid-cols-3">
            <MetricsChart
              title="Memoria usada"
              data={SERIE_SISTEMA as never}
              dataKey="valor"
              icon={HardDrive}
              color={MARCA.azul}
              unit="%"
              type="area"
              height={140}
            />
            <MetricsChart
              title="Peticiones por minuto"
              data={SERIE_SISTEMA as never}
              dataKey="valor"
              icon={Activity}
              color={MARCA.verde}
              unit="req"
              type="line"
              height={140}
            />
          </div>
        </Caja>
      </div>

      <div className="@md:col-span-2 @3xl:col-span-4">
        <Caja titulo="FilterBar" nota="Filtros activos, con su forma de quitarlos.">
          <FilterBar
            filters={[
              { id: 'estado', label: 'Estado', value: 'Pendiente', onRemove: () => {} },
              { id: 'espacio', label: 'Espacio', value: 'Laboratorio Mecatrónica', onRemove: () => {} },
              { id: 'desde', label: 'Desde', value: '20 jun 2026', onRemove: () => {} },
            ]}
            onClearAll={() => {}}
          />
        </Caja>
      </div>
    </div>
  );
}
