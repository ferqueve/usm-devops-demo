import { useState, useMemo, memo } from 'react';
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
  timeTaken?: number;
}

interface HttpTraceTableProps {
  data: HttpTraceInfo | (HttpTraceInfo & { traces?: HttpExchange[] }) | null | undefined;
}


export const HttpTraceTable = memo(function HttpTraceTable({ data }: HttpTraceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hideActuator, setHideActuator] = useState<boolean>(true);
  const [limit, setLimit] = useState<number>(10);

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
          timeTaken: typeof exchange.timeTaken === 'string' ? Number(exchange.timeTaken) || 0 : 0
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
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'success' && trace.response.status >= 200 && trace.response.status < 300) ||
        (statusFilter === 'error' && trace.response.status >= 400);
      
      return matchesSearch && matchesMethod && matchesStatus;
    });
    
    return {
      filteredTraces: filtered.slice(0, limit),
      totalFiltered: filtered.length
    };
  }, [traces, searchTerm, methodFilter, statusFilter, hideActuator, limit]);

  // Badge de método
  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800 border-blue-200',
      POST: 'bg-green-100 text-green-800 border-green-200',
      PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      DELETE: 'bg-red-100 text-red-800 border-red-200',
      PATCH: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[method] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Badge de status
  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 border-green-200';
    if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status >= 400) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (!traces.length) {
    return (
      <div className="border rounded-lg overflow-hidden shadow-card bg-card">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-utec-dark text-white border-b border-white/10">
          <Network className="h-4 w-4 text-utec-blue shrink-0" />
          <h3 className="text-sm font-semibold flex-1">Actividad HTTP Reciente</h3>
        </div>
        <p className="text-muted-foreground text-center py-8 bg-card">
          No hay datos de HTTP exchanges disponibles. Asegúrate de que el endpoint <code className="text-xs bg-gray-100 px-2 py-1 rounded">/actuator/httpexchanges</code> esté habilitado.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-card bg-card">
      <div className="bg-utec-dark text-white">
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
              <SelectItem value="error">Errores (4xx/5xx)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-utec-dark">
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
              filteredTraces.map((trace, index) => (
                <TableRow key={`${trace.timestamp}-${trace.request.uri}-${index}`} className="hover:bg-muted/60">
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
                  <TableCell className="text-xs text-muted-foreground">
                    {trace.timeTaken ? `${trace.timeTaken}ms` : '-'}
                  </TableCell>
                </TableRow>
              ))
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

      <p className="text-xs text-muted-foreground bg-card px-4 py-2">
        Mostrando {filteredTraces.length} de {totalFiltered} peticiones filtradas ({traces.length} totales)
      </p>
    </div>
  );
});

