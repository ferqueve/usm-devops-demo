import { memo } from 'react';
import { Database, Recycle } from 'lucide-react';
import type { MetricInfo } from '@/lib/types/actuator';
import type { PoolMetrics } from '@/hooks/useSystemMetrics';

interface RuntimeCardsProps {
  pool: PoolMetrics | null | undefined;
  gcMetrics: MetricInfo | null | undefined;
  uptimeMetrics: MetricInfo | null | undefined;
}

function stat(metric: MetricInfo | null | undefined, nombre: string): number {
  return metric?.measurements?.find((m) => m.statistic === nombre)?.value ?? 0;
}

function Panel({
  icon: Icon,
  title,
  accent,
  children,
  aside,
}: Readonly<{
  icon: typeof Database;
  title: string;
  accent: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}>) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="flex items-center gap-2.5 border-b border-white/10 bg-chrome px-4 py-2.5 text-white">
        <span className="h-4 w-1 shrink-0 rounded-sm" style={{ backgroundColor: accent }} aria-hidden />
        <Icon className="h-4 w-4 shrink-0 text-white/70" />
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {aside && <span className="ml-auto text-xs text-white/60 tabular-nums">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

function Fila({
  label,
  value,
  hint,
  alerta,
}: Readonly<{ label: string; value: string; hint?: string; alerta?: boolean }>) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      <div className={`shrink-0 text-sm font-semibold tabular-nums ${alerta ? 'text-utec-red' : ''}`}>
        {value}
      </div>
    </div>
  );
}

/**
 * Pool de conexiones y recolección de basura: las dos cosas que explican una
 * app lenta cuando la CPU y la memoria se ven bien.
 */
export const RuntimeCards = memo(function RuntimeCards({ pool, gcMetrics, uptimeMetrics }: RuntimeCardsProps) {
  const pausas = stat(gcMetrics, 'COUNT');
  const tiempoTotalSeg = stat(gcMetrics, 'TOTAL_TIME');
  const pausaMaximaSeg = stat(gcMetrics, 'MAX');
  const uptimeSeg = stat(uptimeMetrics, 'VALUE');

  // Cuánto del tiempo de vida se fue en pausas de GC. Arriba de 1% ya duele.
  const porcentajeEnGc = uptimeSeg > 0 ? (tiempoTotalSeg / uptimeSeg) * 100 : 0;
  const pausasPorMinuto = uptimeSeg > 0 ? pausas / (uptimeSeg / 60) : 0;

  const enUso = pool ? pool.activas + pool.libres : 0;
  const ocupacion = pool && pool.maximo > 0 ? (pool.activas / pool.maximo) * 100 : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <Panel
        icon={Database}
        title="Pool de conexiones"
        accent="#184897"
        aside={pool ? `${enUso} de ${pool.maximo}` : undefined}
      >
        {pool ? (
          <>
            <div className="px-4 pt-3">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-500 ${ocupacion >= 90 ? 'bg-utec-red' : 'bg-utec-blue'}`}
                  style={{ width: `${Math.min(ocupacion, 100)}%` }}
                />
              </div>
            </div>
            <div className="divide-y">
              <Fila label="En uso" value={String(pool.activas)} hint="atendiendo una consulta ahora" />
              <Fila label="Libres" value={String(pool.libres)} hint="listas para usarse" />
              <Fila
                label="Esperando conexión"
                value={String(pool.esperando)}
                hint="hilos en cola por una conexión"
                alerta={pool.esperando > 0}
              />
              <Fila label="Máximo del pool" value={String(pool.maximo)} />
            </div>
          </>
        ) : (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            El backend no expone métricas de HikariCP.
          </p>
        )}
      </Panel>

      <Panel
        icon={Recycle}
        title="Recolección de basura"
        accent="#86bb4c"
        aside={`${porcentajeEnGc.toFixed(2)}% del tiempo`}
      >
        <div className="divide-y">
          <Fila
            label="Pausas totales"
            value={pausas.toLocaleString('es-UY')}
            hint={`${pausasPorMinuto.toFixed(1)} por minuto`}
          />
          <Fila
            label="Tiempo total en pausa"
            value={`${tiempoTotalSeg.toFixed(2)} s`}
            hint="la app estuvo congelada este rato"
          />
          <Fila
            label="Pausa más larga"
            value={`${(pausaMaximaSeg * 1000).toFixed(0)} ms`}
            alerta={pausaMaximaSeg > 1}
          />
        </div>
      </Panel>
    </div>
  );
});
