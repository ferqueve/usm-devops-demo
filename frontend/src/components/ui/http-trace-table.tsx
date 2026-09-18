import { useState, useMemo, memo, Fragment } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Network, Search, Filter } from 'lucide-react';
import type { HttpExchange, HttpTraceInfo } from '@/lib/types/actuator';

interface HttpTrace {
  timestamp: string;
  request: {
    method: string;
    uri: string;
  };
  response: {
    status: number;
  };
  /** Milisegundos. El actuator lo manda como duración ISO-8601 ("PT0.021S"). */
  timeTaken?: number;
  usuario?: string;
  requestHeaders?: Record<string, string[]>;
  responseHeaders?: Record<string, string[]>;
}

/**
 * El actuator manda timeTaken como duración ISO-8601 ("PT0.021S", "PT1.5S").
 * Number() sobre eso da NaN, y por eso la columna mostraba "-" en todas las
 * filas.
 */
function parseDuracionMs(valor: unknown): number {
  if (typeof valor === 'number') return valor;
  if (typeof valor !== 'string' || valor.length === 0) return 0;
  const iso = /^PT(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(valor);
  if (iso) {
    const minutos = Number(iso[1] ?? 0);
    const segundos = Number(iso[2] ?? 0);
    return (minutos * 60 + segundos) * 1000;
  }
  const plano = Number(valor);
  return Number.isNaN(plano) ? 0 : plano;
}

function formatDuracion(ms: number): string {
  if (ms <= 0) return '—';
  if (ms < 1) return '<1 ms';
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${Math.round(ms)} ms`;
}

interface HttpTraceTableProps {
  data: HttpTraceInfo | (HttpTraceInfo & { traces?: HttpExchange[] }) | null | undefined;
}


function ListaHeaders({ titulo, headers }: Readonly<{ titulo: string; headers?: Record<string, string[]> }>) {
  const entradas = Object.entries(headers ?? {});
  if (entradas.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</div>
      <dl className="grid gap-x-3 gap-y-0.5 font-mono text-[11px] sm:grid-cols-[auto_1fr]">
        {entradas.map(([nombre, valores]) => (
          <Fragment key={nombre}>
            <dt className="text-muted-foreground">{nombre}</dt>
            <dd className="break-all">{valores.join(', ')}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

export const HttpTraceTable = memo(function HttpTraceTable({ data }: HttpTraceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hideActuator, setHideActuator] = useState<boolean>(true);
  const [limit, setLimit] = useState<number>(10);
  const [expandida, setExpandida] = useState<string | null>(null);

  // Extraer traces del formato de actuator (httpexchanges o httptrace)
  const traces: HttpTrace[] = useMemo(() => {
    // Spring Boot 2.2+ usa "exchanges", versiones anteriores usan "traces"
    const dataWithTraces = data as (HttpTraceInfo & { traces?: HttpExchange[] }) | null | undefined;
    const exchanges: HttpExchange[] = dataWithTraces?.exchanges ?? dataWithTraces?.traces ?? [];

    // Normalizar el formato
    return exchanges.slice(0, 50).map((exchange) => {
      const req = exchange.request;
      const res = exchange.response;
      if (req && res) {
        return {
          timestamp: exchange.timestamp ?? '',
          request: {
            method: req.method ?? '',
            uri: req.uri ?? ''
          },
          response: {
            status: res.status ?? 0
          },
          timeTaken: parseDuracionMs(exchange.timeTaken),
          usuario: exchange.principal?.name,
          requestHeaders: req.headers,
          responseHeaders: res.headers,
        };
      }
      // Si viene en formato httptrace (antiguo) sin request/response, descartar
      return {
        timestamp: exchange.timestamp ?? '',
        request: { method: '', uri: '' },
        response: { status: 0 },
        timeTaken: 0
      };
    });
  }, [data]);

  // Filtrar traces
  const { filteredTraces, totalFiltered } = useMemo(() => {
    const filtered = traces.filter(trace => {
      // Filtrar Actuator si el switch está activo
      if (hideActuator && trace.request.uri.includes('/actuator')) {
        return false;
      }
      
      const matchesSearch = trace.request.uri.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMethod = methodFilter === 'all' || trace.request.method === methodFilter;
      const status = trace.response.status;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'success' && status >= 200 && status < 300) ||
        (statusFilter === 'client' && status >= 400 && status < 500) ||
        (statusFilter === 'server' && status >= 500) ||
        (statusFilter === 'error' && status >= 400) ||
        (statusFilter === 'slow' && (trace.timeTaken ?? 0) >= 500);

      return matchesSearch && matchesMethod && matchesStatus;
    });
    
    return {
      filteredTraces: filtered.slice(0, limit),
      totalFiltered: filtered.length
    };
  }, [traces, searchTerm, methodFilter, statusFilter, hideActuator, limit]);

  // Resumen de lo que se está viendo: sin esto hay que contar filas a ojo.
  const resumen = useMemo(() => {
    const visibles = traces.filter((t) => !hideActuator || !t.request.uri.includes('/actuator'));
    const errores = visibles.filter((t) => t.response.status >= 400).length;
    const lentas = visibles.filter((t) => (t.timeTaken ?? 0) >= 500).length;
    const conTiempo = visibles.filter((t) => (t.timeTaken ?? 0) > 0);
    const demoraMedia = conTiempo.length > 0
      ? conTiempo.reduce((acc, t) => acc + (t.timeTaken ?? 0), 0) / conTiempo.length
      : 0;
    return { total: visibles.length, errores, lentas, demoraMedia };
  }, [traces, hideActuator]);

  // Badge de método
  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800 border-blue-200',
      POST: 'bg-green-100 text-green-800 border-green-200',
      PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      DELETE: 'bg-red-100 text-red-800 border-red-200',
      PATCH: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[method] || 'bg-muted text-foreground border-border';
  };

  // Badge de status
  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 border-green-200';
    if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status >= 400) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-muted text-foreground border-border';
  };

  if (!traces.length) {
    return (
      <div className="border rounded-lg overflow-hidden shadow-card bg-card">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-chrome text-white border-b border-white/10">
          <Network className="h-4 w-4 text-utec-blue shrink-0" />
          <h3 className="text-sm font-semibold flex-1">Actividad HTTP Reciente</h3>
        </div>
        <p className="text-muted-foreground text-center py-8 bg-card">
          No hay datos de HTTP exchanges disponibles. Asegúrate de que el endpoint <code className="text-xs bg-muted px-2 py-1 rounded">/actuator/httpexchanges</code> esté habilitado.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-card bg-card">
      <div className="bg-chrome text-white">
        {/* Fila 1: título + Ocultar Actuator + Mostrar N */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Network className="h-4 w-4 text-utec-blue shrink-0" />
          <h3 className="text-sm font-semibold flex-1">Actividad HTTP Reciente</h3>
          <div className="flex items-center gap-1.5">
            <Switch
              id="hide-actuator"
              checked={hideActuator}
              onCheckedChange={setHideActuator}
            />
            <Label htmlFor="hide-actuator" className="text-[11px] cursor-pointer whitespace-nowrap text-white/80">
              Ocultar Actuator
            </Label>
          </div>
          <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
            <SelectTrigger className="w-[110px] h-7 text-[11px] bg-white/10 border-white/20 text-white hover:bg-white/15">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Mostrar 10</SelectItem>
              <SelectItem value="25">Mostrar 25</SelectItem>
              <SelectItem value="50">Mostrar 50</SelectItem>
              <SelectItem value="100">Mostrar 100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fila 2: search + filtros */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-white/10">
          <div className="flex-1 min-w-0 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
            <Input
              placeholder="Buscar por URI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 bg-white/5 border-white/15 text-white text-xs placeholder:text-white/40 focus-visible:ring-white/30"
            />
          </div>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/15">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/15">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Exitosos (2xx)</SelectItem>
              <SelectItem value="client">Del cliente (4xx)</SelectItem>
              <SelectItem value="server">Del servidor (5xx)</SelectItem>
              <SelectItem value="error">Todos los errores</SelectItem>
              <SelectItem value="slow">Lentas (500 ms o más)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-chrome">
            <TableRow className="hover:bg-transparent border-b border-white/10">
              <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide">Timestamp</TableHead>
              <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide">Método</TableHead>
              <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide">URI</TableHead>
              <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide">Status</TableHead>
              <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide">Tiempo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTraces.length > 0 ? (
              filteredTraces.map((trace, index) => {
                const id = `${trace.timestamp}-${trace.request.uri}-${index}`;
                const esError = trace.response.status >= 400;
                const esLenta = (trace.timeTaken ?? 0) >= 500;
                const abierta = expandida === id;

                return (
                  <Fragment key={id}>
                    <TableRow
                      onClick={() => setExpandida(abierta ? null : id)}
                      className={`cursor-pointer hover:bg-muted/60 ${esError ? 'bg-utec-red/10 hover:bg-utec-red/15' : ''}`}
                    >
                      <TableCell className="font-mono text-xs">
                        {new Date(trace.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${getMethodBadge(trace.request.method)}`}>
                          {trace.request.method}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-md truncate">
                        {trace.request.uri}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${getStatusBadge(trace.response.status)}`}>
                          {trace.response.status}
                        </span>
                      </TableCell>
                      <TableCell className={`text-xs tabular-nums ${esLenta ? 'font-semibold text-utec-orange' : 'text-muted-foreground'}`}>
                        {formatDuracion(trace.timeTaken ?? 0)}
                      </TableCell>
                    </TableRow>

                    {abierta && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="bg-muted/40 p-0">
                          <div className="grid gap-4 px-4 py-3 text-xs md:grid-cols-2">
                            <div className="min-w-0">
                              <div className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">Petición</div>
                              <p className="break-all font-mono">{trace.request.method} {trace.request.uri}</p>
                              <p className="mt-1 text-muted-foreground">
                                Usuario: <span className="font-medium text-foreground">{trace.usuario ?? 'anónimo'}</span>
                              </p>
                              <p className="text-muted-foreground">
                                Fecha: <span className="font-medium text-foreground">{new Date(trace.timestamp).toLocaleString()}</span>
                              </p>
                              <ListaHeaders titulo="Headers de la petición" headers={trace.requestHeaders} />
                            </div>
                            <div className="min-w-0">
                              <div className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">Respuesta</div>
                              <p>
                                Estado <span className="font-semibold">{trace.response.status}</span> en{' '}
                                <span className="font-semibold">{formatDuracion(trace.timeTaken ?? 0)}</span>
                              </p>
                              <ListaHeaders titulo="Headers de la respuesta" headers={trace.responseHeaders} />
                              {!trace.requestHeaders && !trace.responseHeaders && (
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                  El backend no está publicando los headers. Se habilitan con
                                  <code className="mx-1 rounded bg-muted px-1 py-0.5">management.httpexchanges.recording.include</code>
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No se encontraron resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-card px-4 py-2 text-xs text-muted-foreground">
        <span>
          Mostrando {filteredTraces.length} de {totalFiltered} filtradas · {resumen.total} en la ventana
        </span>
        <span className={resumen.errores > 0 ? 'font-semibold text-utec-red' : ''}>
          {resumen.errores} con error
        </span>
        <span className={resumen.lentas > 0 ? 'font-semibold text-utec-orange' : ''}>
          {resumen.lentas} lentas
        </span>
        <span>demora media {formatDuracion(resumen.demoraMedia)}</span>
        <span className="ml-auto">Tocá una fila para ver sus headers</span>
      </div>
    </div>
  );
});

