import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, CheckCircle2, CheckCircle, XCircle } from 'lucide-react';
import type {
  HealthInfo,
  LiquibaseBean,
  LiquibaseChangeSet,
  LiquibaseContext,
  LiquibaseInfo,
} from '@/lib/types/actuator';

interface LiquibaseTimelineProps {
  data: LiquibaseInfo | null | undefined;
  health: HealthInfo | null | undefined;
}

function extractChangeSetsFromBeans(liquibaseBeans: Record<string, LiquibaseBean>): LiquibaseChangeSet[] {
  for (const beanKey of Object.keys(liquibaseBeans)) {
    const bean = liquibaseBeans[beanKey];
    if (bean?.changeSets && Array.isArray(bean.changeSets)) {
      return bean.changeSets;
    }
  }
  return [];
}

function extractChangeSetsFromContexts(contexts: Record<string, LiquibaseContext>): LiquibaseChangeSet[] {
  for (const contextKey of Object.keys(contexts)) {
    const context = contexts[contextKey];
    if (!context?.liquibaseBeans) continue;
    const found = extractChangeSetsFromBeans(context.liquibaseBeans);
    if (found.length > 0) return found;
  }
  return [];
}

function extractChangeSets(data: LiquibaseInfo | null | undefined): LiquibaseChangeSet[] {
  if (!data) return [];
  if (data.changeSets && Array.isArray(data.changeSets)) {
    return data.changeSets;
  }
  if (data.contexts) {
    return extractChangeSetsFromContexts(data.contexts);
  }
  return [];
}

function TitleBar({
  dbStatus,
  dbDetails,
  count,
}: Readonly<{
  dbStatus: string;
  dbDetails: Record<string, unknown> | undefined;
  count?: number;
}>) {
  const isUp = dbStatus === 'UP';
  return (
    <div className="bg-chrome text-white border-b border-white/10">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <Database className="h-4 w-4 text-utec-blue shrink-0" />
        <h3 className="text-sm font-semibold flex-1">Base de Datos</h3>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-utec-green' : 'text-utec-red'}`}>
          {isUp ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {dbStatus}
        </span>
        {typeof count === 'number' && (
          <span className="text-xs text-white/70 tabular-nums">{count} migraciones</span>
        )}
      </div>
      {dbDetails && Object.keys(dbDetails).length > 0 && (
        <div className="px-4 py-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-white/60 border-t border-white/10">
          {Object.entries(dbDetails).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span>{key.replaceAll(/([A-Z])/g, ' $1').trim()}:</span>
              <span className="text-white/90 font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LiquibaseTimeline({ data, health }: Readonly<LiquibaseTimelineProps>) {
  const [verTodas, setVerTodas] = useState(false);
  const changeSetsOriginal = extractChangeSets(data);
  // Las últimas primero: de 134 migraciones, la que importa es la que se acaba
  // de aplicar, no createTable de hace un año.
  const changeSets = [...changeSetsOriginal].reverse();
  const visibles = verTodas ? changeSets : changeSets.slice(0, 8);
  const dbStatus = health?.components?.db?.status || 'UNKNOWN';
  const dbDetails = health?.components?.db?.details;

  if (!changeSets.length) {
    return (
      <div className="border rounded-lg overflow-hidden shadow-card">
        <TitleBar dbStatus={dbStatus} dbDetails={dbDetails} />
        <div className="text-center py-8 space-y-2 bg-card">
          <p className="text-muted-foreground">
            No hay información de migraciones Liquibase disponible.
          </p>
          <p className="text-xs text-muted-foreground">
            Verifica que el endpoint <code className="bg-muted px-2 py-1 rounded">actuator/liquibase</code> esté habilitado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-card">
      <TitleBar dbStatus={dbStatus} dbDetails={dbDetails} count={changeSets.length} />
      <p className="border-b bg-muted/30 px-4 py-1.5 text-[11px] text-muted-foreground">
        Las más recientes primero
      </p>
      <ScrollArea className={verTodas ? 'h-[400px]' : ''}>
        <Table>
          <TableHeader className="bg-chrome">
            <TableRow className="hover:bg-transparent border-b border-white/10">
              <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide w-[60px]">#</TableHead>
              <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide w-[120px]">ID</TableHead>
              <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide">Descripción</TableHead>
              <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide w-[100px]">Autor</TableHead>
              <TableHead className="h-9 text-white/70 text-xs font-semibold uppercase tracking-wide w-[150px]">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.map((changeSet, index) => (
              <TableRow key={`${changeSet.id}-${index}`}>
                <TableCell className="font-medium text-xs text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    {changeSet.orderExecuted || index + 1}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{changeSet.id}</TableCell>
                <TableCell className="text-xs">
                  <div className="max-w-[300px]">
                    <p className="truncate">{changeSet.description || '-'}</p>
                    {changeSet.changeLog && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {changeSet.changeLog}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs">{changeSet.author}</TableCell>
                <TableCell className="text-xs">
                  {changeSet.dateExecuted
                    ? new Date(changeSet.dateExecuted).toLocaleDateString('es', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      {changeSets.length > 8 && (
        <button
          type="button"
          onClick={() => setVerTodas(!verTodas)}
          className="w-full border-t bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          {verTodas
            ? 'Mostrar solo las últimas 8'
            : `Ver las ${changeSets.length} migraciones`}
        </button>
      )}
    </div>
  );
}

