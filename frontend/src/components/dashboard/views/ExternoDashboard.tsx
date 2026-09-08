import { Link } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, Clock, Megaphone, XCircle } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Panel } from './_components/Panel';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';
import { EventoFila } from './_components/Filas';
import { Anillo, Tendencia, UTEC, variacion } from './_components/Graficos';

interface ExternoDashboardProps {
  data: DashboardData | null;
  loading: boolean;
  misReservas: Reserva[];
  onViewDetails: (r: Reserva) => void;
}

export function ExternoDashboard({ data, loading, misReservas, onViewDetails }: Readonly<ExternoDashboardProps>) {
  // Los totales salen del agregado del backend y no de la lista: la lista trae
  // las ultimas cincuenta, asi que contarla daria de menos.
  const stats = data?.stats;
  const pendientes = stats?.reservasPendientes ?? 0;
  const aprobadas = stats?.reservasAprobadas ?? 0;
  const canceladas = stats?.reservasCanceladas ?? 0;
  const eventosPublicosHoy = stats?.reservasHoy ?? 0;
  // El total tambien del agregado: la lista se corta en cincuenta.
  const totalSolicitudes = stats?.totalReservas ?? misReservas.length;
  const eventos = data?.eventos ?? [];
  const porMes = data?.reservaStats?.reservasPorMes ?? {};
  const cambio = variacion(porMes);
  const estados = [
    { nombre: 'Aprobadas', valor: aprobadas, color: UTEC.verde },
    { nombre: 'En revisión', valor: pendientes, color: UTEC.amarillo },
    { nombre: 'Rechazadas', valor: canceladas, color: UTEC.rojo },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <Link
          to="/reservations?new=true"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <CalendarPlus className="h-4 w-4" />
          Nueva solicitud
        </Link>
      </div>

      <StatStrip
        loading={loading}
        items={[
          { label: 'En revisión', value: pendientes, hint: 'esperando respuesta', icon: Clock, bg: 'yellow', to: '/reservations' },
          { label: 'Aprobadas', value: aprobadas, hint: 'confirmadas', icon: CheckCircle2, bg: 'green', to: '/reservations' },
          { label: 'Rechazadas', value: canceladas, hint: 'no aprobadas', icon: XCircle, bg: 'red', to: '/reservations' },
          { label: 'Hoy en el campus', value: eventosPublicosHoy, hint: 'eventos públicos', bg: 'blue', to: '/calendar' },
          { label: 'Eventos', value: stats?.eventosProximos ?? 0, hint: 'abiertos al público', icon: Megaphone, bg: 'cyan', to: '/eventos' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel
          title="Cómo vienen mis pedidos"
          count={cambio !== null ? `${cambio > 0 ? '+' : ''}${cambio}% contra el mes anterior` : undefined}
          accentColor="#184897"
        >
          <Tendencia datos={porMes} />
        </Panel>

        <Panel title="En qué quedaron" count={`${totalSolicitudes} en total`} accentColor="#86bb4c">
          <Anillo porciones={estados} leyendaCentro="pedidos" alto={132} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel
          title="Mis solicitudes"
          count={totalSolicitudes > 0 ? totalSolicitudes : undefined}
          accentColor="#F6CA21"
          action={{ label: 'ver todas', to: '/reservations' }}
        >
          {misReservas.length > 0 ? (
            <div className="divide-y divide-border/60">
              {misReservas.slice(0, 8).map((r) => (
                <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} showEstado showAvatar={false} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin solicitudes enviadas." />
          )}
        </Panel>

        <Panel
          title="Eventos abiertos"
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

      <Panel
        title="Esta semana en el campus"
        count={data?.proximasReservas?.length || undefined}
        accentColor="#184897"
        action={{ label: 'calendario', to: '/calendar' }}
      >
        {data?.proximasReservas && data.proximasReservas.length > 0 ? (
          <div className="divide-y divide-border/60">
            {data.proximasReservas.slice(0, 6).map((r) => (
              <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} />
            ))}
          </div>
        ) : (
          <EmptyState title="Sin actividades públicas próximas." />
        )}
      </Panel>
    </div>
  );
}
