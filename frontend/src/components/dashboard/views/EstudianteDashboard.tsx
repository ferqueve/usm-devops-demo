import { CalendarDays, Flame, GraduationCap, MapPin, Megaphone, Award } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Panel } from './_components/Panel';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';
import { EventoFila, MateriaFila, TutoriaFila } from './_components/Filas';
import { Anillo, BarrasHorizontales, UTEC } from './_components/Graficos';

interface EstudianteDashboardProps {
  data: DashboardData | null;
  loading: boolean;
  onViewDetails: (r: Reserva) => void;
}

/**
 * Lo del estudiante: primero lo suyo -- sus materias, su próxima tutoría, los
 * eventos a los que se anotó -- y recién después lo que pasa en el campus.
 *
 * Antes eran tres tarjetas, dos de ellas en cero y ninguna propia: cursaba
 * decenas de materias y tenía tutorías agendadas, y nada de eso se veía.
 */
export function EstudianteDashboard({ data, loading, onViewDetails }: Readonly<EstudianteDashboardProps>) {
  const stats = data?.stats;
  const proximas = data?.proximasReservas ?? [];
  const materias = data?.misMaterias ?? [];
  const tutorias = data?.misTutorias ?? [];
  const eventos = data?.eventos ?? [];

  // Cuántos créditos lleva por semestre: es la forma de ver el avance de la
  // carrera de un vistazo.
  const creditosPorSemestre = (() => {
    const suma = new Map<number, number>();
    for (const m of materias) {
      if (m.semestre == null) continue;
      suma.set(m.semestre, (suma.get(m.semestre) ?? 0) + (m.creditos ?? 0));
    }
    return [...suma.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([semestre, creditos]) => ({ nombre: `Sem ${semestre}`, valor: creditos }));
  })();

  const asistidas = stats?.tutoriasAsistidas ?? 0;
  const agendadas = stats?.tutorias ?? 0;
  const tutoriasAnillo = [
    { nombre: 'Asistidas', valor: asistidas, color: UTEC.verde },
    { nombre: 'Por venir', valor: agendadas, color: UTEC.cian },
  ];

  return (
    <div className="space-y-5">
      <StatStrip
        loading={loading}
        items={[
          { label: 'Mis materias', value: stats?.materias ?? 0, hint: `${stats?.creditos ?? 0} créditos`, icon: GraduationCap, bg: 'blue', to: '/materias?tab=listado' },
          { label: 'Tutorías', value: stats?.tutorias ?? 0, hint: 'agendadas', icon: Award, bg: 'green', to: '/materias?tab=tutorias' },
          { label: 'Racha', value: stats?.racha ?? 0, hint: 'tutorías seguidas', icon: Flame, bg: 'orange', to: '/materias?tab=tutorias' },
          { label: 'Eventos', value: stats?.eventosProximos ?? 0, hint: 'próximos', icon: Megaphone, bg: 'cyan', to: '/eventos' },
          { label: 'Hoy', value: stats?.reservasHoy ?? 0, hint: 'reservas en el campus', icon: CalendarDays, bg: 'dark', to: '/calendar' },
          { label: 'Espacios libres', value: stats?.espaciosDisponibles ?? 0, hint: `de ${stats?.totalEspacios ?? 0}`, icon: MapPin, bg: 'yellow', to: '/rooms' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel
          title="Créditos por semestre"
          count={`${stats?.creditos ?? 0} en total`}
          accentColor="#184897"
          action={{ label: 'plan', to: '/materias?tab=mapa' }}
        >
          <BarrasHorizontales datos={creditosPorSemestre} multicolor />
        </Panel>

        <Panel title="Mis tutorías" count={`racha de ${stats?.racha ?? 0}`} accentColor="#86bb4c">
          <Anillo
            porciones={tutoriasAnillo}
            centro={asistidas + agendadas}
            leyendaCentro="tutorías"
            alto={132}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
            <EmptyState title="No tenés tutorías agendadas." />
          )}
        </Panel>

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
            <EmptyState title="Todavía no te inscribiste a ninguna materia." />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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

        <Panel
          title="Esta semana en el campus"
          count={proximas.length || undefined}
          accentColor="#F6CA21"
          action={{ label: 'calendario', to: '/calendar' }}
        >
          {proximas.length > 0 ? (
            <div className="divide-y divide-border/60">
              {proximas.slice(0, 6).map((r) => (
                <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin actividades programadas." />
          )}
        </Panel>
      </div>
    </div>
  );
}
