import { Link } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Section } from './_components/Section';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';

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
        ]}
      />

      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
        <Section
          title="Mis solicitudes"
          count={misReservas.length > 0 ? `${misReservas.length}` : undefined}
          action={{ label: 'ver todas', to: '/reservations' }}
        >
          {misReservas.length > 0 ? (
            <div className="divide-y divide-border/60">
              {misReservas.slice(0, 6).map((r) => (
                <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} showEstado showAvatar={false} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin solicitudes enviadas." />
          )}
        </Section>

        <Section
          title="Eventos públicos"
          action={{ label: 'calendario', to: '/calendar' }}
        >
          {data?.proximasReservas && data.proximasReservas.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.proximasReservas.slice(0, 6).map((r) => (
                <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin eventos próximos." />
          )}
        </Section>
      </div>
    </div>
  );
}
