import { useMemo } from 'react';
import { CalendarClock, CheckCircle2, Flame, Inbox, Megaphone, Stamp } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';
import { StatStrip } from './_components/StatStrip';
import { Panel } from './_components/Panel';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';
import { PresionFila } from './_components/Filas';
import { Anillo, RitmoSemanal, Tendencia, UTEC, variacion } from './_components/Graficos';
import { Hero } from './_components/Hero';

interface AnalistaDashboardProps {
  data: DashboardData | null;
  loading: boolean;
  reservasPrioritarias: RecomendacionAnalista[];
  reservasPendientes: Reserva[];
  loadingPrioritarias: boolean;
  onViewDetails: (r: Reserva) => void;
}

function emparejarPrioritarias(
  prioritarias: RecomendacionAnalista[],
  pendientes: Reserva[],
): Array<{ reserva: Reserva; urgencia: number; razon: string }> {
  const byId = new Map(pendientes.map(r => [r.id, r]));
  const result: Array<{ reserva: Reserva; urgencia: number; razon: string }> = [];
  for (const p of prioritarias) {
    const r = p.reservaId ? byId.get(p.reservaId) : undefined;
    if (!r) continue;
    result.push({ reserva: r, urgencia: p.urgencia ?? 0, razon: p.razon ?? '' });
  }
  return result;
}

export function AnalistaDashboard({
  data, loading, reservasPrioritarias, reservasPendientes, loadingPrioritarias,
  onViewDetails,
}: Readonly<AnalistaDashboardProps>) {
  const stats = data?.stats;
  const totalPendientes = data?.reservaStats?.totalPendientes ?? stats?.reservasPendientes ?? 0;
  const totalAprobadas = data?.reservaStats?.totalAprobadas ?? stats?.reservasAprobadas ?? 0;
  const reservasHoyCount = stats?.reservasHoy ?? 0;
  const presion = data?.espaciosConPresion ?? [];
  const maximaPresion = presion.length > 0 ? presion[0].pendientes : 0;
  const porMes = data?.reservaStats?.reservasPorMes ?? {};
  const porDia = data?.reservaStats?.reservasPorDiaSemana ?? {};
  const cambio = variacion(porMes);
  const estados = [
    { nombre: 'Aprobadas', valor: totalAprobadas, color: UTEC.verde },
    { nombre: 'Pendientes', valor: totalPendientes, color: UTEC.amarillo },
    { nombre: 'Canceladas', valor: data?.reservaStats?.totalCanceladas ?? 0, color: UTEC.rojo },
  ];

  const cola = useMemo(() => {
    const matched = emparejarPrioritarias(reservasPrioritarias, reservasPendientes);
    if (matched.length > 0) return matched;
    return reservasPendientes.slice(0, 14).map(r => ({ reserva: r, urgencia: 0, razon: '' }));
  }, [reservasPrioritarias, reservasPendientes]);

  const masPresionado = presion[0];

  return (
    <div className="flex min-h-0 shrink-0 flex-col gap-3 lg:h-full lg:shrink lg:overflow-hidden">
      <Hero
        etiqueta="LA COLA DE HOY"
        titulo={`${totalPendientes.toLocaleString('es-UY')} solicitudes esperando`}
        detalle={masPresionado
          ? `${masPresionado.nombre} concentra ${masPresionado.pendientes} · ${reservasPrioritarias.length} urgentes`
          : `${reservasPrioritarias.length} marcadas como urgentes`}
        icono={Inbox}
        patron="nodos"
        foco={{ valor: stats?.resueltasPorMi ?? 0, leyenda: 'resueltas por mí' }}
        accion={{ label: 'Ir a la cola', to: '/reservations' }}
      />

      <StatStrip
        loading={loading}
        items={[
          { label: 'En cola', value: totalPendientes, hint: 'asignadas o sin asignar', icon: Inbox, bg: 'yellow', to: '/reservations' },
          { label: 'Urgentes', value: reservasPrioritarias.length, hint: loadingPrioritarias ? 'calculando…' : 'requieren atención', icon: Flame, bg: 'red', to: '/reservations' },
          { label: 'Aprobadas', value: totalAprobadas, hint: 'históricas', icon: CheckCircle2, bg: 'green', to: '/statistics' },
          { label: 'Hoy', value: reservasHoyCount, hint: 'reservas programadas', icon: CalendarClock, bg: 'blue', to: '/calendar' },
          { label: 'Resueltas por mí', value: stats?.resueltasPorMi ?? 0, hint: 'aprobadas o rechazadas', icon: Stamp, bg: 'dark', to: '/reservations' },
          { label: 'Eventos', value: stats?.eventosProximos ?? 0, hint: 'próximos', icon: Megaphone, bg: 'cyan', to: '/eventos' },
        ]}
      />

      <div className="grid min-h-0 gap-3 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1">
        <div className="grid min-h-0 gap-3 lg:grid-rows-2">
          <Panel
            title="Reservas por mes"
            count={cambio !== null ? `${cambio > 0 ? '+' : ''}${cambio}%` : undefined}
            accentColor="#184897"
            action={{ label: 'estadísticas', to: '/statistics' }}
          >
            <Tendencia datos={porMes} alto={128} llenar />
          </Panel>

          <Panel title="Qué días se carga" accentColor="#00c7ff">
            <RitmoSemanal datos={porDia} alto={128} llenar />
          </Panel>
        </div>

        <Panel
          title="Cola"
          count={loadingPrioritarias ? 'calculando…' : `${totalPendientes} pendientes`}
          accentColor="#F6CA21"
          action={{ label: 'ver todas', to: '/reservations' }}
          scroll
        >
          {cola.length > 0 ? (
            <div className="divide-y divide-border/60">
              {cola.map(({ reserva, urgencia, razon }) => (
                <ReservaRow
                  key={reserva.id}
                  reserva={reserva}
                  onClick={onViewDetails}
                  accent={urgencia >= 7 ? 'urgent' : null}
                  rightSlot={urgencia >= 7 ? (
                    <span className="text-[10px] uppercase tracking-wider text-red-600 font-medium" title={razon}>
                      urgente
                    </span>
                  ) : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Cola al día." />
          )}
        </Panel>

        <div className="grid min-h-0 gap-3 lg:grid-rows-2">
          <Panel title="En qué estado están" accentColor="#86bb4c">
            <Anillo porciones={estados} leyendaCentro="reservas" alto={118} llenar />
          </Panel>

          <Panel
            title="Dónde se acumula"
            accentColor="#e8630a"
            action={{ label: 'reservas', to: '/reservations' }}
            scroll
          >
            {presion.length > 0 ? (
              <div className="divide-y divide-border/60">
                {presion.map((e) => <PresionFila key={e.id} espacio={e} maximo={maximaPresion} />)}
              </div>
            ) : (
              <EmptyState title="Nada esperando." />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
