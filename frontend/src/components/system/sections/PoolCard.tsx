import { memo } from 'react';
import { Database } from 'lucide-react';
import type { PoolMetrics } from '@/hooks/useSystemMetrics';

/**
 * Pool de conexiones, en la vista donde uno lo busca: si la base va lenta, lo
 * primero es ver si quedan conexiones libres o hay hilos haciendo cola.
 */
export const PoolCard = memo(function PoolCard({ pool }: Readonly<{ pool: PoolMetrics | null | undefined }>) {
  if (!pool) return null;

  const ocupacion = pool.maximo > 0 ? (pool.activas / pool.maximo) * 100 : 0;
  const saturado = ocupacion >= 90 || pool.esperando > 0;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="flex items-center gap-2.5 border-b border-white/10 bg-chrome px-4 py-2.5 text-white">
        <span className="h-4 w-1 shrink-0 rounded-sm bg-utec-blue" aria-hidden />
        <Database className="h-4 w-4 shrink-0 text-white/70" />
        <h3 className="text-sm font-semibold tracking-tight">Pool de conexiones</h3>
        <span className={`ml-auto text-xs tabular-nums ${saturado ? 'font-semibold text-marca-rojo-texto' : 'text-white/60'}`}>
          {pool.activas} en uso · {pool.libres} libres · máx {pool.maximo}
        </span>
      </div>
      <div className="px-4 py-3">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-500 ${saturado ? 'bg-utec-red' : 'bg-utec-blue'}`}
            style={{ width: `${Math.min(ocupacion, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {pool.esperando > 0
            ? `${pool.esperando} ${pool.esperando === 1 ? 'hilo está esperando' : 'hilos están esperando'} una conexión: el pool quedó chico.`
            : 'Nadie está esperando una conexión.'}
        </p>
      </div>
    </div>
  );
});
