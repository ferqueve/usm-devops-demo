import { Link } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, Clock, GraduationCap, ListChecks, Users, CalendarClock } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Panel } from './_components/Panel';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';
import { EventoFila, MateriaFila, TutoriaFila } from './_components/Filas';

interface DocenteDashboardProps {
  data: DashboardData | null;
  loading: boolean;
  misReservas: Reserva[];
  onViewDetails: (r: Reserva) => void;
}

/**
 * Lo del docente: sus materias y sus tutorías arriba, sus reservas abajo.
 *
 * Antes la pantalla solo hablaba de reservas, aunque el rol es académico:
 * dictaba materias con inscriptos y daba tutorías, y nada de eso aparecía.
 */
export function DocenteDashboard({ data, loading, misReservas, onViewDetails }: Readonly<DocenteDashboardProps>) {
  const stats = data?.stats;
  const ahora = Date.now();
  const proximasMias = misReservas
    .filter(r => new Date(r.inicio).getTime() >= ahora && r.estado === 'APROBADO')
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
    .slice(0, 6);
  const misPendientes = misReservas.filter(r => r.estado === 'PENDIENTE').slice(0, 6);
  // El contador va del agregado del backend: la lista trae las últimas
  // cincuenta y contarla daría de menos.
  const totalPendientes = stats?.reservasPendientes ?? misPendientes.length;
  const materias = data?.misMaterias ?? [];
  const tutorias = data?.misTutorias ?? [];
  const eventos = data?.eventos ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <Link
          to="/reservations?new=true"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <CalendarPlus className="h-4 w-4" />
          Nueva reserva
        </Link>
      </div>

      <StatStrip
        loading={loading}
        items={[
          { label: 'Mis materias', value: stats?.materias ?? 0, hint: 'que dicto', icon: GraduationCap, bg: 'blue', to: '/materias?tab=listado' },
          { label: 'Inscriptos', value: stats?.inscriptos ?? 0, hint: 'en mis materias', icon: Users, bg: 'green', to: '/materias?tab=listado' },
          { label: 'Tutorías', value: stats?.tutorias ?? 0, hint: 'franjas próximas', icon: CalendarClock, bg: 'cyan', to: '/materias?tab=tutorias' },
          { label: 'Pendientes', value: totalPendientes, hint: 'esperando aprobación', icon: Clock, bg: 'yellow', to: '/reservations' },
          { label: 'Confirmadas', value: stats?.reservasAprobadas ?? 0, hint: 'aprobadas', icon: CheckCircle2, bg: 'dark', to: '/reservations' },
          { label: 'Hoy', value: stats?.reservasHoy ?? 0, hint: 'reservas en el campus', icon: ListChecks, bg: 'orange', to: '/calendar' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Mis materias"
          count={stats?.materias || undefined}
          accentColor="#184897"
          action={{ label: 'ver todas', to: '/materias?tab=listado' }}
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
          title="Mis próximas tutorías"
          count={tutorias.length || undefined}
          accentColor="#00c7ff"
          action={{ label: 'ver todas', to: '/materias?tab=tutorias' }}
        >
          {tutorias.length > 0 ? (
            <div className="divide-y divide-border/60">
              {tutorias.map((t) => <TutoriaFila key={t.id} tutoria={t} />)}
            </div>
          ) : (
            <EmptyState title="Sin franjas de tutoría próximas." />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel
          title="Mis reservas"
          count={proximasMias.length > 0 ? `${proximasMias.length} próximas` : `${totalPendientes} pendientes`}
          accentColor="#F6CA21"
          action={{ label: 'ver todas', to: '/reservations' }}
        >
          {(() => {
            const filas = proximasMias.length > 0 ? proximasMias : misPendientes;
            if (filas.length === 0) {
              return <EmptyState title="Sin reservas próximas ni pendientes." />;
            }
            return (
              <div className="divide-y divide-border/60">
                {filas.map((r) => (
                  <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} showEstado showAvatar={false} />
                ))}
              </div>
            );
          })()}
        </Panel>

        <Panel
          title="Próximos eventos"
          count={eventos.length || undefined}
          accentColor="#86bb4c"
          action={{ label: 'ver todos', to: '/eventos' }}
        >
          {eventos.length > 0 ? (
            <div className="divide-y divide-border/60">
              {eventos.map((e) => <EventoFila key={e.id} evento={e} />)}
            </div>
          ) : (
            <EmptyState title="Sin eventos próximos." />
          )}
        </Panel>
      </div>
    </div>
  );
}
