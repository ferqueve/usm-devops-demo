import { useMemo } from 'react';
import { CalendarClock, CheckCircle2, Flame, Inbox } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';
import { StatStrip } from './_components/StatStrip';
import { Section } from './_components/Section';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';

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

  const cola = useMemo(() => {
    const matched = emparejarPrioritarias(reservasPrioritarias, reservasPendientes);
    if (matched.length > 0) return matched;
    return reservasPendientes.slice(0, 5).map(r => ({ reserva: r, urgencia: 0, razon: '' }));
  }, [reservasPrioritarias, reservasPendientes]);

  return (
    <div className="space-y-5">
      <StatStrip
        loading={loading}
        items={[
          { label: 'En cola', value: totalPendientes, hint: 'asignadas o sin asignar', icon: Inbox, bg: 'yellow', to: '/reservations' },
          { label: 'Urgentes', value: reservasPrioritarias.length, hint: loadingPrioritarias ? 'calculando…' : 'requieren atención', icon: Flame, bg: 'red', to: '/reservations' },
          { label: 'Aprobadas', value: totalAprobadas, hint: 'históricas', icon: CheckCircle2, bg: 'green', to: '/statistics' },
          { label: 'Hoy', value: reservasHoyCount, hint: 'reservas programadas', icon: CalendarClock, bg: 'blue', to: '/calendar' },
        ]}
      />

      <Section
        title="Cola"
        count={loadingPrioritarias ? 'calculando…' : `${totalPendientes} pendiente${totalPendientes === 1 ? '' : 's'}`}
        action={totalPendientes > cola.length ? { label: 'ver todas', to: '/reservations' } : undefined}
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
      </Section>

      <Section
        title="Próximas aprobadas"
        action={{ label: 'calendario', to: '/calendar' }}
      >
        {data?.proximasReservas && data.proximasReservas.length > 0 ? (
          <div className="divide-y divide-border/60">
            {data.proximasReservas.slice(0, 6).map((r) => (
              <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} />
            ))}
          </div>
        ) : (
          <EmptyState title="Sin confirmadas próximas." />
        )}
      </Section>
    </div>
  );
}
