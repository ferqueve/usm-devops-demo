import { CalendarClock, CheckCircle2, Clock, GraduationCap, ListChecks, Users } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Panel } from './_components/Panel';
import { Hero } from './_components/Hero';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';
import { EventoFila, MateriaFila } from './_components/Filas';
import { BarrasHorizontales, Progreso, UTEC } from './_components/Graficos';

interface DocenteDashboardProps {
  data: DashboardData | null;
  loading: boolean;
  misReservas: Reserva[];
  onViewDetails: (r: Reserva) => void;
}

/**
 * Lo del docente, en una pantalla: su próxima clase de tutoría destacada, sus
 * números, y una banda con lo académico y lo de reservas.
 */
export function DocenteDashboard({ data, loading, misReservas, onViewDetails }: Readonly<DocenteDashboardProps>) {
  const stats = data?.stats;
  const ahora = Date.now();
  const proximasMias = misReservas
    .filter(r => new Date(r.inicio).getTime() >= ahora && r.estado === 'APROBADO')
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const misPendientes = misReservas.filter(r => r.estado === 'PENDIENTE');
  // El contador va del agregado del backend: la lista trae las últimas
  // cincuenta y contarla daría de menos.
  const totalPendientes = stats?.reservasPendientes ?? misPendientes.length;
  const materias = data?.misMaterias ?? [];
  const tutorias = data?.misTutorias ?? [];
  const eventos = data?.eventos ?? [];
  const inscriptosPorMateria = data?.inscriptosPorMateria ?? [];
  const proxima = tutorias[0];

  return (
    <div className="flex min-h-0 shrink-0 flex-col gap-3 lg:h-full lg:shrink lg:overflow-hidden">
      {proxima ? (
        <Hero
          etiqueta="TU PRÓXIMA TUTORÍA A DAR"
          titulo={proxima.materiaNombre ?? 'Tutoría'}
          detalle={[proxima.espacioNombre, `${proxima.agendados} de ${proxima.cupo} anotados`].filter(Boolean).join(' · ')}
          icono={CalendarClock}
          patron="circuito"
          cuandoISO={proxima.inicio}
          accion={{ label: 'Ver', to: `/tutorias/${proxima.id}` }}
        />
      ) : (
        <Hero
          etiqueta="TUS MATERIAS"
          titulo={`${stats?.materias ?? 0} materias a tu cargo`}
          detalle={`${stats?.inscriptos ?? 0} estudiantes inscriptos`}
          icono={GraduationCap}
          patron="circuito"
          foco={{ valor: stats?.inscriptos ?? 0, leyenda: 'inscriptos' }}
          accion={{ label: 'Ver materias', to: '/materias?tab=listado' }}
        />
      )}

      <StatStrip
        loading={loading}
        items={[
          { label: 'Mis materias', value: stats?.materias ?? 0, hint: 'que dicto', icon: GraduationCap, bg: 'blue', to: '/materias?tab=listado' },
          { label: 'Inscriptos', value: stats?.inscriptos ?? 0, hint: 'en mis materias', icon: Users, bg: 'green', to: '/materias?tab=listado' },
          { label: 'Tutorías', value: stats?.tutorias ?? 0, hint: 'franjas próximas', icon: CalendarClock, bg: 'cyan', to: '/materias?tab=tutorias' },
          { label: 'Pendientes', value: totalPendientes, hint: 'esperando aprobación', icon: Clock, bg: 'yellow', to: '/reservations' },
          { label: 'Confirmadas', value: stats?.reservasAprobadas ?? 0, hint: 'aprobadas', icon: CheckCircle2, bg: 'dark', to: '/reservations' },
          { label: 'Hoy', value: stats?.reservasHoy ?? 0, hint: 'en el campus', icon: ListChecks, bg: 'orange', to: '/calendar' },
        ]}
      />

      <div className="grid min-h-0 gap-3 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1">
        <div className="grid min-h-0 gap-3 lg:grid-rows-2">
          <Panel
            title="Inscriptos por materia"
            count={`${stats?.inscriptos ?? 0} en total`}
            accentColor="#86bb4c"
            action={{ label: 'materias', to: '/materias?tab=listado' }}
            scroll
          >
            <BarrasHorizontales datos={inscriptosPorMateria} color={UTEC.verde} />
          </Panel>

          <Panel title="Ocupación de mis tutorías" accentColor="#00c7ff" scroll>
            {tutorias.length > 0 ? (
              <div className="space-y-2.5 py-1">
                {tutorias.map((t) => (
                  <Progreso
                    key={t.id}
                    etiqueta={t.materiaNombre ?? 'Tutoría'}
                    actual={t.agendados}
                    total={t.cupo}
                    color={t.cupo > 0 && t.agendados >= t.cupo ? UTEC.naranja : UTEC.cian}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Sin franjas próximas." />
            )}
          </Panel>
        </div>

        <Panel
          title="Mis materias"
          count={stats?.materias || undefined}
          accentColor="#184897"
          action={{ label: 'ver todas', to: '/materias?tab=listado' }}
          scroll
        >
          {materias.length > 0 ? (
            <div className="divide-y divide-border/60">
              {materias.map((m) => <MateriaFila key={m.id} materia={m} />)}
            </div>
          ) : (
            <EmptyState title="No dictás ninguna materia." />
          )}
        </Panel>

        <Panel
          title="Mis reservas"
          count={proximasMias.length > 0 ? `${proximasMias.length} próximas` : `${totalPendientes} pendientes`}
          accentColor="#F6CA21"
          action={{ label: 'nueva reserva', to: '/reservations?new=true' }}
          scroll
        >
          {(() => {
            const filas = proximasMias.length > 0 ? proximasMias : misPendientes;
            if (filas.length === 0 && eventos.length === 0) {
              return <EmptyState title="Sin reservas próximas ni pendientes." />;
            }
            return (
              <div className="divide-y divide-border/60">
                {filas.map((r) => (
                  <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} showEstado showAvatar={false} />
                ))}
                {eventos.map((e) => <EventoFila key={`e${e.id}`} evento={e} />)}
              </div>
            );
          })()}
        </Panel>
      </div>

    </div>
  );
}
