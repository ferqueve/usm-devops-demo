import { Link } from 'react-router-dom';
import { AlertCircle, Boxes, ClipboardList, Wrench } from 'lucide-react';
import type { InventoryStats } from '@/lib/types/spaces';
import { StatStrip } from './_components/StatStrip';
import { Section } from './_components/Section';
import { EmptyState } from './_components/EmptyState';

interface EspaciosStats {
  totalEspacios: number;
  disponibles: number;
  enMantenimiento: number;
  ocupados: number;
}

interface MantenimientoDashboardProps {
  loading: boolean;
  inventarioStats: InventoryStats | null;
  espaciosStats: EspaciosStats | null;
  pendingInventoryRequests: number;
}

interface AlertaRow {
  icon: typeof AlertCircle;
  tone: 'amber' | 'red';
  text: React.ReactNode;
  to: string;
}

export function MantenimientoDashboard({
  loading, inventarioStats, espaciosStats, pendingInventoryRequests,
}: Readonly<MantenimientoDashboardProps>) {
  const inv = inventarioStats;
  const esp = espaciosStats;

  // El porcentaje sale de los dos numeros que ya tenemos: pedirselo al backend
  // era una columna mas para una division.
  const porcentajeDisponibles = inv && inv.totalItems > 0
    ? Math.round((inv.disponibles / inv.totalItems) * 100)
    : 0;

  const alertas: AlertaRow[] = [];
  if (pendingInventoryRequests > 0) {
    alertas.push({
      icon: ClipboardList,
      tone: 'amber',
      to: '/inventory/requests',
      text: <><b>{pendingInventoryRequests}</b> solicitud{pendingInventoryRequests === 1 ? '' : 'es'} de inventario por responder</>,
    });
  }
  if ((inv?.danados ?? 0) > 0) {
    alertas.push({
      icon: AlertCircle,
      tone: 'red',
      to: '/inventory',
      text: <><b>{inv!.danados}</b> item{inv!.danados === 1 ? '' : 's'} dañado{inv!.danados === 1 ? '' : 's'}</>,
    });
  }
  if ((esp?.enMantenimiento ?? 0) > 0) {
    alertas.push({
      icon: Wrench,
      tone: 'amber',
      to: '/rooms',
      text: <><b>{esp!.enMantenimiento}</b> espacio{esp!.enMantenimiento === 1 ? '' : 's'} fuera de servicio</>,
    });
  }

  return (
    <div className="space-y-5">
      <StatStrip
        loading={loading}
        items={[
          { label: 'Items', value: inv?.totalItems ?? 0, hint: `${inv?.tiposUnicos ?? 0} tipos`, icon: Boxes, bg: 'blue', to: '/inventory' },
          { label: 'Disponibles', value: inv?.disponibles ?? 0, hint: `${porcentajeDisponibles}% del parque`, bg: 'green', to: '/inventory' },
          { label: 'Mantenimiento', value: inv?.mantenimiento ?? 0, hint: 'requieren reparación', icon: Wrench, bg: 'orange', to: '/inventory' },
          { label: 'Dañados', value: inv?.danados ?? 0, hint: (inv?.danados ?? 0) > 0 ? 'fuera de uso' : 'sin novedad', bg: 'red', to: '/inventory' },
          { label: 'Sin asignar', value: inv?.sinAsignar ?? 0, hint: 'esperando ubicación', bg: 'yellow', to: '/inventory' },
          { label: 'Espacios', value: `${esp?.disponibles ?? 0}/${esp?.totalEspacios ?? 0}`, hint: 'operativos', bg: 'cyan', to: '/rooms' },
        ]}
      />

      {alertas.length > 0 ? (
        <Section title="Pendientes" count={`${alertas.length}`}>
          <div className="divide-y divide-border/60">
            {alertas.map((a) => {
              const Icon = a.icon;
              const toneClass = a.tone === 'red' ? 'text-red-600' : 'text-amber-600';
              return (
                <Link
                  key={a.to + (typeof a.text === 'string' ? a.text : '')}
                  to={a.to}
                  className="flex items-center gap-3 py-2.5 -mx-3 px-3 rounded-sm hover:bg-muted/40 transition-colors"
                >
                  <Icon className={`h-4 w-4 ${toneClass} shrink-0`} />
                  <span className="text-sm flex-1 min-w-0 truncate">{a.text}</span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">revisar</span>
                </Link>
              );
            })}
          </div>
        </Section>
      ) : (
        !loading && <EmptyState title="Todo en orden." />
      )}
    </div>
  );
}
