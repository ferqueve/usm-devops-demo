import { CalendarDays, MapPin } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Section } from './_components/Section';
import { EmptyState } from './_components/EmptyState';
import { ReservaRow } from './_components/ReservaRow';

interface EstudianteDashboardProps {
  data: DashboardData | null;
  loading: boolean;
  onViewDetails: (r: Reserva) => void;
}

export function EstudianteDashboard({ data, loading, onViewDetails }: Readonly<EstudianteDashboardProps>) {
  const stats = data?.stats;
  const proximas = data?.proximasReservas ?? [];

  return (
    <div className="space-y-5">
      <StatStrip
        loading={loading}
        items={[
          { label: 'Hoy', value: stats?.reservasHoy ?? 0, hint: 'reservas en el campus', icon: CalendarDays, bg: 'blue', to: '/calendar' },
          { label: 'Espacios libres', value: stats?.espaciosDisponibles ?? 0, hint: `de ${stats?.totalEspacios ?? 0} totales`, icon: MapPin, bg: 'green', to: '/rooms' },
          { label: 'Próximos eventos', value: proximas.length, hint: 'en agenda', bg: 'cyan', to: '/calendar' },
        ]}
      />

      <Section
        title="Esta semana"
        count={proximas.length > 0 ? `${proximas.length}` : undefined}
        action={{ label: 'calendario', to: '/calendar' }}
      >
        {proximas.length > 0 ? (
          <div className="divide-y divide-border/60">
            {proximas.slice(0, 10).map((r) => (
              <ReservaRow key={r.id} reserva={r} onClick={onViewDetails} />
            ))}
          </div>
        ) : (
          <EmptyState title="Sin actividades programadas." />
        )}
      </Section>
    </div>
  );
}
