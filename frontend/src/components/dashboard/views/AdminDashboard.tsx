import { useMemo } from 'react';
import { Activity, Building2, CalendarClock, ClipboardCheck, Inbox, Users } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';
import { StatStrip } from './_components/StatStrip';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';
import { DualPanel } from './_components/DualPanel';

interface AdminDashboardProps {
  data: DashboardData | null;
  loading: boolean;
  reservasPrioritarias: RecomendacionAnalista[];
  reservasPendientes: Reserva[];
  loadingPrioritarias: boolean;
  pendingInventoryRequests: number;
  onViewDetails: (r: Reserva) => void;
}

function filtrarHoy(reservas: Reserva[]): Reserva[] {
  const ahora = new Date();
  return reservas
    .filter(r => {
      const d = new Date(r.inicio);
      return d.toDateString() === ahora.toDateString() && d.getTime() >= ahora.getTime();
    })
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
}

export function AdminDashboard({
  data, loading, reservasPrioritarias, reservasPendientes, loadingPrioritarias,
  pendingInventoryRequests, onViewDetails,
}: Readonly<AdminDashboardProps>) {
  const stats = data?.stats;
  const reservasHoy = useMemo(
    () => filtrarHoy(data?.proximasReservas ?? []),
    [data?.proximasReservas],
  );

  const urgentesIds = useMemo(() => {
    const ids = new Set<number>();
    for (const p of reservasPrioritarias) {
      if (p.reservaId && (p.urgencia ?? 0) >= 7) ids.add(p.reservaId);
    }
    return ids;
  }, [reservasPrioritarias]);

  const colaUrgente = useMemo(() => {
    if (reservasPrioritarias.length > 0) {
      const ids = new Set(reservasPrioritarias.map(p => p.reservaId).filter(Boolean));
      const matched = reservasPendientes.filter(r => ids.has(r.id));
      if (matched.length > 0) return matched.slice(0, 6);
    }
    return reservasPendientes.slice(0, 6);
  }, [reservasPrioritarias, reservasPendientes]);

  const totalPendientes = data?.reservaStats?.totalPendientes ?? stats?.reservasPendientes ?? 0;
  const reservasHoyCount = stats?.reservasHoy ?? 0;
  const espaciosLibres = stats?.espaciosDisponibles ?? 0;
  const enMantenimiento = stats?.espaciosEnMantenimiento ?? 0;
  const usuariosActivos = stats?.usuariosActivos ?? 0;
  const tasaAprobacion = (() => {
    const ap = data?.reservaStats?.totalAprobadas ?? 0;
    const ca = data?.reservaStats?.totalCanceladas ?? 0;
    const total = ap + ca + totalPendientes;
    return total > 0 ? Math.round((ap / total) * 100) : 0;
  })();

  return (
    <div className="space-y-5">
      <StatStrip
        loading={loading}
        items={[
          { label: 'A aprobar', value: totalPendientes, hint: 'pendientes en cola', icon: Inbox, bg: 'yellow', to: '/reservations' },
          { label: 'Hoy', value: reservasHoyCount, hint: 'reservas programadas', icon: CalendarClock, bg: 'blue', to: '/calendar' },
          { label: 'Espacios', value: `${espaciosLibres}/${(stats?.totalEspacios ?? 0)}`, hint: enMantenimiento > 0 ? `${enMantenimiento} en mantenimiento` : 'todos disponibles', icon: Building2, bg: 'green', to: '/rooms' },
          { label: 'Usuarios activos', value: usuariosActivos, hint: 'en este momento', icon: Users, bg: 'cyan', to: '/users' },
          { label: 'Inventario', value: pendingInventoryRequests, hint: pendingInventoryRequests > 0 ? 'solicitudes pendientes' : 'al día', icon: ClipboardCheck, bg: 'red', to: '/inventory/requests' },
          { label: 'Aprobación', value: `${tasaAprobacion}%`, hint: 'últimas reservas', icon: Activity, bg: 'dark', to: '/statistics' },
        ]}
      />

      <DualPanel
        left={{
          title: 'Cola',
          count: totalPendientes > 0
            ? `${totalPendientes} pendiente${totalPendientes === 1 ? '' : 's'}${loadingPrioritarias ? ' · calculando prioridades' : ''}`
            : undefined,
          action: totalPendientes > colaUrgente.length ? { label: 'ver todas', to: '/reservations' } : undefined,
          accentColor: '#184897',
          body: colaUrgente.length > 0 ? (
            <div className="divide-y divide-border/60">
              {colaUrgente.map((r) => (
                <ReservaRow
                  key={r.id}
                  reserva={r}
                  onClick={onViewDetails}
                  accent={urgentesIds.has(r.id) ? 'urgent' : null}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin pendientes." />
          ),
        }}
        right={{
          title: 'Hoy',
          count: reservasHoy.length > 0 ? `${reservasHoy.length} por delante` : undefined,
          action: { label: 'calendario', to: '/calendar' },
          accentColor: '#F6CA21',
          body: reservasHoy.length > 0 ? (
            <div className="divide-y divide-border/60">
              {reservasHoy.slice(0, 8).map((r) => (
                <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} />
              ))}
            </div>
          ) : (
            <EmptyState title="No queda nada para hoy." />
          ),
        }}
      />
    </div>
  );
}
