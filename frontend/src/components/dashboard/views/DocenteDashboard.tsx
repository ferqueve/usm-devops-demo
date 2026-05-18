import { Link } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, Clock, ListChecks } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Section } from './_components/Section';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';

interface DocenteDashboardProps {
  data: DashboardData | null;
  loading: boolean;
  misReservas: Reserva[];
  onViewDetails: (r: Reserva) => void;
}

export function DocenteDashboard({ data, loading, misReservas, onViewDetails }: Readonly<DocenteDashboardProps>) {
  const stats = data?.stats;
  const ahora = Date.now();
  const proximasMias = misReservas
    .filter(r => new Date(r.inicio).getTime() >= ahora && r.estado === 'APROBADO')
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
    .slice(0, 6);
  const misPendientes = misReservas.filter(r => r.estado === 'PENDIENTE').slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <Link
          to="/reservations?new=true"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <CalendarPlus className="h-4 w-4" />
          Nueva reserva
        </Link>
      </div>

      <StatStrip
        loading={loading}
        items={[
          { label: 'Pendientes', value: misPendientes.length, hint: 'esperando aprobación', icon: Clock, bg: 'yellow', to: '/reservations' },
          { label: 'Confirmadas', value: stats?.reservasAprobadas ?? 0, hint: 'aprobadas', icon: CheckCircle2, bg: 'green', to: '/reservations' },
          { label: 'Próximas', value: proximasMias.length, hint: 'en agenda', icon: ListChecks, bg: 'blue', to: '/reservations' },
          { label: 'Hoy', value: stats?.reservasHoy ?? 0, hint: 'reservas en el campus', bg: 'cyan', to: '/calendar' },
        ]}
      />

      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
        <Section
          title="Mis próximas"
          count={proximasMias.length > 0 ? `${proximasMias.length}` : undefined}
          action={{ label: 'ver todas', to: '/reservations' }}
        >
          {proximasMias.length > 0 ? (
            <div className="divide-y divide-border/60">
              {proximasMias.map((r) => (
                <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} showAvatar={false} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin clases próximas." />
          )}
        </Section>

        <Section
          title="Pendientes"
          count={misPendientes.length > 0 ? `${misPendientes.length}` : undefined}
        >
          {misPendientes.length > 0 ? (
            <div className="divide-y divide-border/60">
              {misPendientes.map((r) => (
                <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} showAvatar={false} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin pendientes." />
          )}
        </Section>
      </div>
    </div>
  );
}
