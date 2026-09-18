import { memo } from 'react';
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cpu, Activity, MemoryStick, Trash2, Clock, Network } from 'lucide-react';
import { formatBytes, formatUptime } from '@/lib/utils/formatters';
import type { MetricInfo, MetricMeasurement } from '@/lib/types/actuator';

interface JvmDetailsTableProps {
  memoryMetrics: MetricInfo | null | undefined;
  memoryMaxMetrics: MetricInfo | null | undefined;
  cpuMetrics: MetricInfo | null | undefined;
  threadsMetrics: MetricInfo | null | undefined;
  gcMetrics: MetricInfo | null | undefined;
  uptimeMetrics: MetricInfo | null | undefined;
  httpMetrics: MetricInfo | null | undefined;
}

export const JvmDetailsTable = memo(function JvmDetailsTable({
  memoryMetrics,
  memoryMaxMetrics,
  cpuMetrics,
  threadsMetrics,
  gcMetrics,
  uptimeMetrics,
  httpMetrics
}: JvmDetailsTableProps) {
  const findStatistic = (metric: MetricInfo | null | undefined, stat: string): number =>
    metric?.measurements?.find((m: MetricMeasurement) => m.statistic === stat)?.value ?? 0;

  const memoryUsed = findStatistic(memoryMetrics, 'VALUE');
  const memoryMax = memoryMaxMetrics?.measurements?.find((m: MetricMeasurement) => m.statistic === 'VALUE')?.value ?? 2147483648;
  const memoryUsagePercent = memoryMax > 0 ? (memoryUsed / memoryMax) * 100 : 0;
  const cpuUsage = findStatistic(cpuMetrics, 'VALUE');
  const threadsCount = findStatistic(threadsMetrics, 'VALUE');
  const gcCount = findStatistic(gcMetrics, 'COUNT');
  const gcTotalTime = findStatistic(gcMetrics, 'TOTAL_TIME');
  const uptimeSeconds = findStatistic(uptimeMetrics, 'VALUE');
  const httpCount = findStatistic(httpMetrics, 'COUNT');

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrica</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="hidden md:table-cell">Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-muted/60">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  <span className="hidden sm:inline">Memoria Heap</span>
                  <span className="sm:hidden">Memoria</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {formatBytes(memoryUsed)} / {formatBytes(memoryMax)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                {memoryUsagePercent.toFixed(1)}% utilizado
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-muted/60">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  CPU
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {(cpuUsage * 100).toFixed(2)}%
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                Uso del procesador
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-muted/60">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Threads
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(threadsCount)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                Hilos de ejecución
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-muted/60">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                  <span className="hidden sm:inline">Garbage Collection</span>
                  <span className="sm:hidden">GC</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(gcCount)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                {(gcTotalTime / 1000).toFixed(2)}s tiempo total
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-muted/60">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Uptime
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {formatUptime(uptimeSeconds * 1000)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                Tiempo desde inicio
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-muted/60">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-muted-foreground" />
                  HTTP
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(httpCount).toLocaleString()}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                Peticiones procesadas
              </TableCell>
            </TableRow>
        </TableBody>
      </Table>
    </div>
  );
});
