import { useMemo } from 'react';
import { Activity, Building2, CalendarClock, ClipboardCheck, Inbox, Leaf, Users } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';
import { StatStrip } from './_components/StatStrip';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';
import { DualPanel } from './_components/DualPanel';
import { Panel } from './_components/Panel';
import { ActividadFila, EventoFila, PresionFila } from './_components/Filas';
import { Anillo, BarrasHorizontales, Tendencia, UTEC, variacion } from './_components/Graficos';

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
  const salud = data?.salud;
  const verde = data?.sostenibilidad;
  const actividad = data?.actividadReciente ?? [];
  const presion = data?.espaciosConPresion ?? [];
  const maximaPresion = presion.length > 0 ? presion[0].pendientes : 0;
  const eventos = data?.eventos ?? [];
  const usuariosPorRol = Object.entries(data?.userStats?.usuariosPorRol ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const porMes = data?.reservaStats?.reservasPorMes ?? {};
  const cambio = variacion(porMes);
  const barrasUsuarios = usuariosPorRol.map(([rol, cantidad]) => ({
    nombre: rol.charAt(0) + rol.slice(1).toLowerCase(),
    valor: cantidad,
  }));
  const estados: Array<{ nombre: string; valor: number; color: string }> = [
    { nombre: 'Aprobadas', valor: data?.reservaStats?.totalAprobadas ?? 0, color: UTEC.verde },
    { nombre: 'Pendientes', valor: totalPendientes, color: UTEC.amarillo },
    { nombre: 'Canceladas', valor: data?.reservaStats?.totalCanceladas ?? 0, color: UTEC.rojo },
  ];

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

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel
          title="Reservas por mes"
          count={cambio !== null ? `${cambio > 0 ? '+' : ''}${cambio}% contra el mes anterior` : undefined}
          accentColor="#184897"
          action={{ label: 'estadísticas', to: '/statistics' }}
        >
          <Tendencia datos={porMes} />
        </Panel>

        <Panel title="En qué estado están" count={`${(data?.reservaStats?.totalReservas ?? 0).toLocaleString('es-UY')} en total`} accentColor="#86bb4c">
          <Anillo porciones={estados} leyendaCentro="reservas" />
        </Panel>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <Panel
          title="Estado del sistema"
          count={salud ? `${salud.componentes} componentes` : undefined}
          accentColor={salud && salud.estado !== 'UP' ? '#e2001a' : '#86bb4c'}
          action={{ label: 'sistema', to: '/system' }}
        >
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${salud?.estado === 'UP' ? 'bg-utec-green' : 'bg-utec-red'}`}
                aria-hidden
              />
              <span className="text-lg font-semibold">{salud?.estado ?? 'Sin datos'}</span>
              <span className="text-sm text-muted-foreground">
                {salud && salud.caidos.length > 0 ? `· ${salud.caidos.join(', ')} caído(s)` : '· todo al día'}
              </span>
            </div>
            {verde && (
              <div className="flex items-baseline gap-2 border-t pt-3 text-sm">
                <Leaf className="h-4 w-4 shrink-0 text-utec-green" />
                <b className="tabular-nums">{verde.hojasEvitadas.toLocaleString('es-UY')}</b>
                <span className="text-muted-foreground">hojas evitadas ·</span>
                <b className="tabular-nums">{verde.arbolesSalvados.toFixed(1)}</b>
                <span className="text-muted-foreground">árboles</span>
              </div>
            )}
            {barrasUsuarios.length > 0 && (
              <div className="border-t pt-2">
                <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Usuarios por rol</p>
                <BarrasHorizontales datos={barrasUsuarios} alto={118} multicolor />
              </div>
            )}
          </div>
        </Panel>

        <Panel
          title="Actividad reciente"
          count={actividad.length || undefined}
          accentColor="#00c7ff"
          action={{ label: 'auditoría', to: '/audit' }}
        >
          {actividad.length > 0 ? (
            <div className="divide-y divide-border/60">
              {actividad.map((a) => (
                <ActividadFila key={`${a.cuando}-${a.usuario}-${a.entidad}`} actividad={a} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin movimientos registrados." />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Dónde se acumula la cola"
          accentColor="#e8630a"
          action={{ label: 'reservas', to: '/reservations' }}
        >
          {presion.length > 0 ? (
            <div className="divide-y divide-border/60">
              {presion.map((e) => <PresionFila key={e.id} espacio={e} maximo={maximaPresion} />)}
            </div>
          ) : (
            <EmptyState title="Nada esperando." />
          )}
        </Panel>

        <Panel
          title="Próximos eventos"
          count={eventos.length || undefined}
          accentColor="#184897"
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
