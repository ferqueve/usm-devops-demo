import { useMemo } from 'react';
import { Activity, Building2, CalendarClock, ClipboardCheck, Inbox, Leaf, Users } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';
import { StatStrip } from '@/components/common/StatStrip';
import { EmptyState } from '@/components/ui/empty-state';
import { ReservaRow } from './_components/ReservaRow';
import { Panel } from '@/components/common/Panel';
import { Hero } from './_components/Hero';
import { ActividadFila } from './_components/Filas';
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

/** Filas de la cola: el panel scrollea, asi que sobran para pantallas altas. */
const FILAS_COLA = 14;

export function AdminDashboard({
  data, loading, reservasPrioritarias, reservasPendientes, loadingPrioritarias,
  pendingInventoryRequests, onViewDetails,
}: Readonly<AdminDashboardProps>) {
  const stats = data?.stats;

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
      if (matched.length > 0) return matched.slice(0, FILAS_COLA);
    }
    return reservasPendientes.slice(0, FILAS_COLA);
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

  const masPresionado = presion[0];

  return (
    <div className="flex min-h-0 shrink-0 flex-col gap-3 lg:h-full lg:shrink lg:overflow-hidden">
      <Hero
        etiqueta="LO QUE HAY QUE ATENDER"
        titulo={`${totalPendientes.toLocaleString('es-UY')} reservas por aprobar`}
        detalle={[
          masPresionado ? `${masPresionado.nombre} concentra ${masPresionado.pendientes}` : null,
          `${pendingInventoryRequests} solicitudes de inventario`,
          salud ? `sistema ${salud.estado}` : null,
        ].filter(Boolean).join(' · ')}
        icono={Inbox}
        patron="nodos"
        foco={{ valor: `${tasaAprobacion}%`, leyenda: 'aprobación' }}
        accion={{ label: 'Ir a la cola', to: '/reservations' }}
      />

      <StatStrip
        loading={loading}
        items={[
          // `porMes` es la única serie que hoy manda el back: reservas por mes.
          // Va sólo en las celdas que cuentan reservas, que es de lo que habla.
          // Las otras cuatro esperan a que el back devuelva su propia serie;
          // mientras tanto llevan la aclaración de texto y ninguna línea
          // inventada.
          { label: 'A aprobar', value: totalPendientes, serie: porMes, delta: cambio, icon: Inbox, color: 'amarillo', to: '/reservations' },
          { label: 'Hoy', value: reservasHoyCount, serie: porMes, icon: CalendarClock, color: 'azul', to: '/calendar' },
          { label: 'Espacios', value: `${espaciosLibres}/${(stats?.totalEspacios ?? 0)}`, hint: enMantenimiento > 0 ? `${enMantenimiento} en mantenimiento` : 'todos disponibles', icon: Building2, color: 'verde', to: '/rooms' },
          { label: 'Usuarios activos', value: usuariosActivos, hint: 'en este momento', icon: Users, color: 'cian', to: '/users' },
          { label: 'Inventario', value: pendingInventoryRequests, hint: pendingInventoryRequests > 0 ? 'solicitudes pendientes' : 'al día', icon: ClipboardCheck, color: 'rojo', to: '/inventory/requests' },
          { label: 'Aprobación', value: `${tasaAprobacion}%`, hint: 'últimas reservas', icon: Activity, color: 'naranja', to: '/statistics' },
        ]}
      />

      <div className="grid min-h-0 gap-3 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1">
        <div className="grid min-h-0 gap-3 lg:grid-rows-2">
          <Panel
            title="Reservas por mes"
            count={cambio !== null ? `${cambio > 0 ? '+' : ''}${cambio}%` : undefined}
            accentColor={UTEC.azul}
            action={{ label: 'estadísticas', to: '/statistics' }}
          >
            <Tendencia datos={porMes} alto={128} llenar />
          </Panel>

          <Panel title="En qué estado están" accentColor={UTEC.verde}>
            <Anillo porciones={estados} leyendaCentro="reservas" alto={118} llenar />
          </Panel>
        </div>

        <Panel
          title="Cola"
          count={`${totalPendientes} pendientes${loadingPrioritarias ? ' · calculando' : ''}`}
          accentColor={UTEC.amarillo}
          action={{ label: 'ver todas', to: '/reservations' }}
          scroll
        >
          {colaUrgente.length > 0 ? (
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
            <EmptyState variant="linea" title="Sin pendientes." />
          )}
        </Panel>

        <div className="grid min-h-0 gap-3 lg:grid-rows-2">
          <Panel
            title="Estado del sistema"
            count={salud ? `${salud.componentes} componentes` : undefined}
            accentColor={salud && salud.estado !== 'UP' ? UTEC.rojo : UTEC.verde}
            action={{ label: 'sistema', to: '/system' }}
            scroll
          >
            <div className="space-y-2 py-1">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${salud?.estado === 'UP' ? 'bg-utec-green' : 'bg-utec-red'}`}
                  aria-hidden
                />
                <span className="font-semibold">{salud?.estado ?? 'Sin datos'}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {salud && salud.caidos.length > 0 ? `· ${salud.caidos.join(', ')}` : '· todo al día'}
                </span>
              </div>
              {verde && (
                <div className="flex items-baseline gap-2 border-t pt-2 text-sm">
                  <Leaf className="h-4 w-4 shrink-0 text-utec-green" />
                  <b className="tabular-nums">{verde.hojasEvitadas.toLocaleString('es-UY')}</b>
                  <span className="text-muted-foreground">hojas evitadas</span>
                </div>
              )}
              {barrasUsuarios.length > 0 && (
                <div className="border-t pt-1">
                  <p className="mb-1 text-2xs uppercase tracking-wider text-muted-foreground">Usuarios por rol</p>
                  <BarrasHorizontales datos={barrasUsuarios} multicolor />
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Actividad reciente"
            count={actividad.length || undefined}
            accentColor={UTEC.cian}
            action={{ label: 'auditoría', to: '/audit' }}
            scroll
          >
            {actividad.length > 0 ? (
              <div className="divide-y divide-border/60">
                {actividad.map((a) => (
                  <ActividadFila key={`${a.cuando}-${a.usuario}-${a.entidad}`} actividad={a} />
                ))}
              </div>
            ) : (
              <EmptyState variant="linea" title="Sin movimientos." />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
