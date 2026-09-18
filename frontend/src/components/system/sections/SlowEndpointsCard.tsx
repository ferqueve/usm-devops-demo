import { memo, useEffect, useState } from 'react';
import { Gauge, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { statsApi, type SlowEndpoint, type SlowEndpointsResponse } from '@/lib/api/stats';

function methodColor(method: string): string {
  switch (method) {
    case 'GET': return 'bg-utec-blue/15 text-utec-blue border-utec-blue/40';
    case 'POST': return 'bg-utec-green/15 text-utec-green border-utec-green/40';
    case 'PUT':
    case 'PATCH': return 'bg-utec-orange/15 text-utec-orange border-utec-orange/40';
    case 'DELETE': return 'bg-utec-red/15 text-utec-red border-utec-red/40';
    default: return 'bg-muted text-muted-foreground';
  }
}

function p95Color(ms: number): string {
  if (ms < 200) return 'text-utec-green';
  if (ms < 500) return 'text-utec-yellow';
  if (ms < 1000) return 'text-utec-orange';
  return 'text-utec-red';
}

export const SlowEndpointsCard = memo(function SlowEndpointsCard() {
  const [data, setData] = useState<SlowEndpointsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await statsApi.getSlowEndpoints(10);
        if (!cancelled) setData(res ?? null);
      } catch (err) {
        // Sin este catch el rechazo se escapa de load(), que nadie espera, y
        // queda como unhandled rejection. La tarjeta simplemente se muestra
        // vacía si el actuator no responde.
        console.error('Error al cargar los endpoints lentos:', err);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const endpoints: SlowEndpoint[] = data?.top ?? [];
  const max = endpoints.length > 0 ? Math.max(...endpoints.map(e => e.p95)) : 1;

  return (
    <div className="border rounded-lg overflow-hidden shadow-card bg-card">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-chrome text-white border-b border-white/10">
        <Gauge className="h-4 w-4 text-utec-orange shrink-0" />
        <h3 className="text-sm font-semibold flex-1">Endpoints más lentos (p95)</h3>
        {data && (
          <span className="text-xs text-white/70 tabular-nums">unidad: {data.unit}</span>
        )}
      </div>
      {loading && endpoints.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground bg-card">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Cargando métricas...</span>
        </div>
      ) : endpoints.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground bg-card">
          <span className="text-sm">No hay métricas de endpoints todavía</span>
        </div>
      ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-white/10">
                <TableHead className="w-[70px]">Método</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead className="w-[60px] text-right">Hits</TableHead>
                <TableHead className="w-[80px] text-right">Media</TableHead>
                <TableHead className="w-[260px]">p95 / p99</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((e, i) => {
                const widthPct = Math.max(2, Math.round((e.p95 / max) * 100));
                return (
                  <TableRow key={`${e.method}-${e.uri}-${i}`}>
                    <TableCell>
                      <span className={`inline-flex px-1.5 py-0.5 text-2xs font-semibold rounded border ${methodColor(e.method)}`}>
                        {e.method || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[260px]">{e.uri}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{e.count}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{e.meanMs.toFixed(0)} ms</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${p95Color(e.p95).replace('text-', 'bg-')}`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold tabular-nums w-14 text-right ${p95Color(e.p95)}`}>
                          {e.p95.toFixed(0)}
                        </span>
                        <Badge variant="outline" className="text-2xs tabular-nums w-16 justify-end">
                          {e.p99.toFixed(0)} p99
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
      )}
    </div>
  );
});
