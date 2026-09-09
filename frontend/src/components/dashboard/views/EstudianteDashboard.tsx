import { CalendarDays, Flame, GraduationCap, MapPin, Megaphone, Award } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Panel } from './_components/Panel';
import { Hero } from './_components/Hero';
import { EmptyState } from './_components/EmptyState';
import { EventoFila, MateriaFila, TutoriaFila } from './_components/Filas';
import { Anillo, BarrasHorizontales, UTEC } from './_components/Graficos';

interface EstudianteDashboardProps {
  data: DashboardData | null;
  loading: boolean;
  onViewDetails: (r: Reserva) => void;
}

/**
 * Lo del estudiante, en una pantalla.
 *
 * Arriba lo único que tiene que mirar si mira una sola cosa -- su próxima
 * tutoría, con cuenta regresiva --, después sus números, y abajo una sola banda
 * que llena el alto: las listas scrollean por dentro, la página no.
 */
export function EstudianteDashboard({ data, loading }: Readonly<EstudianteDashboardProps>) {
  const stats = data?.stats;
  const materias = data?.misMaterias ?? [];
  const tutorias = data?.misTutorias ?? [];
  const eventos = data?.eventos ?? [];
  const creditosPorSemestre = data?.creditosPorSemestre ?? [];

  const proxima = tutorias[0];
  const asistidas = stats?.tutoriasAsistidas ?? 0;
  const agendadas = stats?.tutorias ?? 0;

  return (
    <div className="flex min-h-0 shrink-0 flex-col gap-3 lg:h-full lg:shrink lg:overflow-hidden">
      {proxima ? (
        <Hero
          etiqueta="TU PRÓXIMA TUTORÍA"
          titulo={proxima.materiaNombre ?? 'Tutoría'}
          detalle={[proxima.docenteNombre, proxima.espacioNombre].filter(Boolean).join(' · ')}
          icono={Award}
          patron="circuito"
          cuandoISO={proxima.inicio}
          accion={{ label: 'Ver', to: `/tutorias/${proxima.id}` }}
        />
      ) : (
        <Hero
          etiqueta="TU SEMESTRE"
          titulo={`${stats?.materias ?? 0} materias en curso`}
          detalle={`${stats?.creditos ?? 0} créditos · racha de ${stats?.racha ?? 0} tutorías`}
          icono={GraduationCap}
          patron="formas"
          foco={{ valor: stats?.creditos ?? 0, leyenda: 'créditos' }}
          accion={{ label: 'Mis materias', to: '/materias?tab=listado' }}
        />
      )}

      <StatStrip
        loading={loading}
        items={[
          { label: 'Mis materias', value: stats?.materias ?? 0, hint: `${stats?.creditos ?? 0} créditos`, icon: GraduationCap, bg: 'blue', to: '/materias?tab=listado' },
          { label: 'Tutorías', value: agendadas, hint: 'agendadas', icon: Award, bg: 'green', to: '/materias?tab=tutorias' },
          { label: 'Racha', value: stats?.racha ?? 0, hint: 'tutorías seguidas', icon: Flame, bg: 'orange', to: '/materias?tab=tutorias' },
          { label: 'Eventos', value: stats?.eventosProximos ?? 0, hint: 'próximos', icon: Megaphone, bg: 'cyan', to: '/eventos' },
          { label: 'Hoy', value: stats?.reservasHoy ?? 0, hint: 'en el campus', icon: CalendarDays, bg: 'dark', to: '/calendar' },
          { label: 'Espacios libres', value: stats?.espaciosDisponibles ?? 0, hint: `de ${stats?.totalEspacios ?? 0}`, icon: MapPin, bg: 'yellow', to: '/rooms' },
        ]}
      />

      <div className="grid min-h-0 gap-3 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1">
        {/* Columna de gráficos: dos paneles que se reparten el alto. */}
        <div className="grid min-h-0 gap-3 lg:grid-rows-2">
          <Panel
            title="Créditos por semestre"
            count={`${stats?.creditos ?? 0} en total`}
            accentColor="#184897"
            action={{ label: 'plan', to: '/materias?tab=mapa' }}
            scroll
          >
            <BarrasHorizontales datos={creditosPorSemestre} multicolor />
          </Panel>

          <Panel title="Mis tutorías" count={`racha de ${stats?.racha ?? 0}`} accentColor="#86bb4c">
            <Anillo
              porciones={[
                { nombre: 'Asistidas', valor: asistidas, color: UTEC.verde },
                { nombre: 'Por venir', valor: agendadas, color: UTEC.cian },
              ]}
              centro={asistidas + agendadas}
              leyendaCentro="tutorías"
              alto={118}
              llenar
            />
          </Panel>
        </div>

        <Panel
          title="Mis materias"
          count={stats?.materias || undefined}
          accentColor="#00c7ff"
          action={{ label: 'ver todas', to: '/materias?tab=listado' }}
          scroll
        >
          {materias.length > 0 ? (
            <div className="divide-y divide-border/60">
              {materias.map((m) => <MateriaFila key={m.id} materia={m} />)}
            </div>
          ) : (
            <EmptyState title="Todavía no te inscribiste a ninguna materia." />
          )}
        </Panel>

        <Panel
          title="Lo que viene"
          count={`${tutorias.length} tutorías · ${eventos.length} eventos`}
          accentColor="#F6CA21"
          action={{ label: 'agenda', to: '/materias?tab=tutorias' }}
          scroll
        >
          {tutorias.length > 0 || eventos.length > 0 ? (
            <div className="divide-y divide-border/60">
              {tutorias.map((t) => <TutoriaFila key={`t${t.id}`} tutoria={t} />)}
              {eventos.map((e) => <EventoFila key={`e${e.id}`} evento={e} />)}
            </div>
          ) : (
            <EmptyState title="Nada agendado por ahora." />
          )}
        </Panel>
      </div>
    </div>
  );
}
