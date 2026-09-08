import { memo } from 'react';
import { Activity, AlertTriangle, Gauge, Timer } from 'lucide-react';
import type { TrafficMetrics } from '@/hooks/useSystemMetrics';

interface TrafficCardProps {
  traffic: TrafficMetrics | null | undefined;
  /** Segundos desde el arranque: sirve para el promedio por minuto. */
  uptimeSeconds: number;
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${ms.toFixed(0)} ms`;
}

function Dato({
  icon: Icon,
  label,
  value,
  hint,
  alerta,
}: Readonly<{
  icon: typeof Activity;
  label: string;
  value: string;
  hint?: string;
  alerta?: boolean;
}>) {
  return (
    <div className="min-w-0 px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${alerta ? 'text-utec-red' : ''}`}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground truncate">{hint}</div>}
    </div>
  );
}

/**
 * Pulso del servidor: cuánto atendió, cuánto tardó y cuánto falló desde que
 * arrancó. Son los tres números que se miran antes que cualquier gráfico, y
 * hasta ahora no estaban en ninguna vista.
 */
export const TrafficCard = memo(function TrafficCard({ traffic, uptimeSeconds }: TrafficCardProps) {
  if (!traffic) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        El servidor todavía no reportó tráfico HTTP.
      </div>
    );
  }

  const porMinuto = uptimeSeconds > 0 ? traffic.peticiones / (uptimeSeconds / 60) : 0;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="flex items-center gap-2.5 border-b border-white/10 bg-utec-dark px-4 py-2.5 text-white">
        <span className="h-4 w-1 shrink-0 rounded-sm bg-utec-cyan" aria-hidden />
        <h3 className="text-sm font-semibold tracking-tight">Tráfico HTTP</h3>
        <span className="ml-auto text-xs text-white/60">desde el arranque</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
        <Dato
          icon={Activity}
          label="Peticiones"
          value={traffic.peticiones.toLocaleString('es-UY')}
          hint={`${porMinuto.toFixed(1)} por minuto`}
        />
        <Dato
          icon={Timer}
          label="Demora media"
          value={formatMs(traffic.demoraMediaMs)}
          alerta={traffic.demoraMediaMs > 500}
        />
        <Dato
          icon={Gauge}
          label="Demora máxima"
          value={formatMs(traffic.demoraMaximaMs)}
          hint="la peor petición"
        />
        <Dato
          icon={AlertTriangle}
          label="Errores 5xx"
          value={traffic.errores.toLocaleString('es-UY')}
          hint={`${traffic.porcentajeError.toFixed(2)}% del total`}
          alerta={traffic.porcentajeError > 1}
        />
      </div>
    </div>
  );
});
