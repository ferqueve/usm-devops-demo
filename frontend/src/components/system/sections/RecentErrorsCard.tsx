import { memo, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { statsApi, type RecentError, type RecentErrorsResponse } from '@/lib/api/stats';

function levelBadge(level: string) {
  if (level === 'ERROR') {
    return <Badge variant="destructive" className="text-[10px]">ERROR</Badge>;
  }
  if (level === 'WARN') {
    return (
      <Badge variant="outline" className="text-[10px] border-utec-yellow text-utec-yellow">
        WARN
      </Badge>
    );
  }
  return <Badge variant="secondary" className="text-[10px]">{level}</Badge>;
}

/**
 * Ruido conocido: warnings que aparecen siempre y no dicen nada de la salud del
 * sistema. Se pueden ocultar para que los errores de verdad no se pierdan entre
 * ellos.
 */
const RUIDO_CONOCIDO: ReadonlyArray<{ patron: RegExp; motivo: string }> = [
  { patron: /SQL Warning Code: 0, SQLState: 01000/i, motivo: 'aviso de Hibernate, sin efecto' },
  { patron: /has a collation version mismatch/i, motivo: 'collation de PostgreSQL' },
  { patron: /Token JWT expirado/i, motivo: 'sesión vencida, el usuario vuelve a entrar' },
  { patron: /spring\.jpa\.open-in-view/i, motivo: 'aviso de arranque de Spring' },
];

function motivoDeRuido(mensaje: string): string | null {
  return RUIDO_CONOCIDO.find((r) => r.patron.test(mensaje))?.motivo ?? null;
}

function shortLogger(logger: string): string {
  const parts = logger.split('.');
  return parts.length > 3 ? parts.slice(-2).join('.') : logger;
}

function relativeTime(iso: string): string {
  const diffSeconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSeconds < 60) return `hace ${diffSeconds}s`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays}d`;
}

export const RecentErrorsCard = memo(function RecentErrorsCard() {
  const [data, setData] = useState<RecentErrorsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await statsApi.getRecentErrors(10, 24);
        if (!cancelled) setData(res ?? null);
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

  const [ocultarRuido, setOcultarRuido] = useState(true);

  const todos: RecentError[] = useMemo(() => data?.top ?? [], [data?.top]);
  const { errors, ruidoOculto } = useMemo(() => {
    const visibles = ocultarRuido ? todos.filter((e) => !motivoDeRuido(e.message)) : todos;
    return { errors: visibles, ruidoOculto: todos.length - visibles.length };
  }, [todos, ocultarRuido]);

  return (
    <div className="border rounded-lg overflow-hidden shadow-card bg-card">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-utec-dark text-white border-b border-white/10">
        <AlertTriangle className="h-4 w-4 text-utec-red shrink-0" />
        <h3 className="text-sm font-semibold flex-1">
          Top errores últimas {data?.windowHours ?? 24}h
        </h3>
        {data && (
          <span className="text-xs text-white/70 tabular-nums">
            {data.totalGroupsInWindow} grupos · {data.totalCaptured} eventos
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <Switch id="ocultar-ruido" checked={ocultarRuido} onCheckedChange={setOcultarRuido} />
          <Label htmlFor="ocultar-ruido" className="cursor-pointer whitespace-nowrap text-[11px] text-white/80">
            Ocultar ruido conocido
          </Label>
        </div>
      </div>
      {loading && errors.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground bg-card">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Cargando errores...</span>
        </div>
      ) : errors.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-8 text-muted-foreground bg-card">
          <div className="flex items-center">
            <Inbox className="h-5 w-5 mr-2" />
            <span className="text-sm">Sin errores en las últimas {data?.windowHours ?? 24}h</span>
          </div>
          {ruidoOculto > 0 && (
            <span className="text-xs">
              {ruidoOculto} {ruidoOculto === 1 ? 'grupo conocido oculto' : 'grupos conocidos ocultos'}
            </span>
          )}
        </div>
      ) : (
          <Table className="table-fixed w-full">
            <TableHeader className="bg-utec-dark">
              <TableRow className="hover:bg-transparent border-b border-white/10">
                <TableHead className="h-9 w-[70px] text-white/70 text-xs font-semibold uppercase tracking-wide">Nivel</TableHead>
                <TableHead className="h-9 w-[60px] text-center text-white/70 text-xs font-semibold uppercase tracking-wide">Count</TableHead>
                <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide">Mensaje</TableHead>
                <TableHead className="h-9 w-[180px] hidden lg:table-cell text-white/70 text-xs font-semibold uppercase tracking-wide">Logger</TableHead>
                <TableHead className="h-9 w-[90px] text-right text-white/70 text-xs font-semibold uppercase tracking-wide">Último</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((e, i) => (
                <TableRow key={`${e.level}-${e.message}-${i}`}>
                  <TableCell className="align-top">{levelBadge(e.level)}</TableCell>
                  <TableCell className="text-center font-semibold tabular-nums align-top">{e.count}</TableCell>
                  <TableCell className="align-top !whitespace-normal min-w-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm break-words line-clamp-2 cursor-help">{e.message}</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="max-w-[600px] text-xs whitespace-pre-wrap break-words">
                        {e.message}
                      </TooltipContent>
                    </Tooltip>
                    {e.exception && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[11px] text-utec-red break-words line-clamp-1 cursor-help">
                            {e.exception}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="max-w-[600px] text-xs whitespace-pre-wrap break-words">
                          {e.exception}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell align-top !whitespace-normal break-all">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{shortLogger(e.logger)}</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {e.logger}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground tabular-nums align-top">
                    {relativeTime(e.lastTimestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      )}
      {ruidoOculto > 0 && errors.length > 0 && (
        <p className="border-t bg-card px-4 py-2 text-xs text-muted-foreground">
          {ruidoOculto} {ruidoOculto === 1 ? 'grupo conocido oculto' : 'grupos conocidos ocultos'}: avisos de
          Hibernate, collation de PostgreSQL, sesiones vencidas y avisos de arranque de Spring.
        </p>
      )}
    </div>
  );
});
