import { CheckCircle2, Clock, Megaphone, XCircle } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Panel } from './_components/Panel';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';
import { EventoFila } from './_components/Filas';
import { Anillo, Tendencia, UTEC, variacion } from './_components/Graficos';
import { Hero } from './_components/Hero';

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

  const proximoEvento = eventos[0];

  return (
    <div className="flex min-h-0 shrink-0 flex-col gap-3 lg:h-full lg:shrink lg:overflow-hidden">
      {proximoEvento ? (
        <Hero
          etiqueta="PRÓXIMO EVENTO ABIERTO"
          titulo={proximoEvento.titulo}
          detalle={[proximoEvento.espacioNombre, proximoEvento.inscrito ? 'ya estás anotado' : `${proximoEvento.inscriptos} anotados`]
            .filter(Boolean).join(' · ')}
          icono={Megaphone}
          patron="plasma"
          cuandoISO={proximoEvento.inicio}
          accion={{ label: 'Ver', to: `/eventos/${proximoEvento.id}` }}
        />
      ) : (
        <Hero
          etiqueta="MIS SOLICITUDES"
          titulo={`${pendientes} esperando respuesta`}
          detalle={`${aprobadas} aprobadas · ${canceladas} rechazadas`}
          icono={Clock}
          patron="plasma"
          foco={{ valor: totalSolicitudes, leyenda: 'en total' }}
          accion={{ label: 'Nueva solicitud', to: '/reservations?new=true' }}
        />
      )}

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

      <div className="grid min-h-0 gap-3 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1">
        <div className="grid min-h-0 gap-3 lg:grid-rows-2">
          <Panel
            title="Cómo vienen mis pedidos"
            count={cambio !== null ? `${cambio > 0 ? '+' : ''}${cambio}%` : undefined}
            accentColor="#184897"
          >
            <Tendencia datos={porMes} alto={128} llenar />
          </Panel>

          <Panel title="En qué quedaron" count={`${totalSolicitudes} en total`} accentColor="#86bb4c">
            <Anillo porciones={estados} leyendaCentro="pedidos" alto={118} llenar />
          </Panel>
        </div>

        <Panel
          title="Mis solicitudes"
          count={totalSolicitudes > 0 ? totalSolicitudes : undefined}
          accentColor="#F6CA21"
          action={{ label: 'nueva', to: '/reservations?new=true' }}
          scroll
        >
          {misReservas.length > 0 ? (
            <div className="divide-y divide-border/60">
              {misReservas.map((r) => (
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
          accentColor="#00c7ff"
          action={{ label: 'ver todos', to: '/eventos' }}
          scroll
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
