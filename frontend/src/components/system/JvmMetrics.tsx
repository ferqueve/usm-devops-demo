import { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cpu, Activity, MemoryStick, Trash2, Clock, Network, Zap, BarChart3 } from 'lucide-react';
import { MetricsChart } from '@/components/ui/metrics-chart';
import { formatBytes, formatUptime } from '@/core/utils/formatters';

interface JvmMetricsProps {
  memoryMetrics: any;
  memoryMaxMetrics: any;
  cpuMetrics: any;
  threadsMetrics: any;
  gcMetrics: any;
  uptimeMetrics: any;
  httpMetrics: any;
  metricsHistory: any[];
}

export const JvmMetrics = memo(function JvmMetrics({
  memoryMetrics,
  memoryMaxMetrics,
  cpuMetrics,
  threadsMetrics,
  gcMetrics,
  uptimeMetrics,
  httpMetrics,
  metricsHistory
}: JvmMetricsProps) {
  const memoryUsed = memoryMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
  const memoryMax = memoryMaxMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 2147483648;
  const memoryUsagePercent = memoryMax > 0 ? (memoryUsed / memoryMax) * 100 : 0;
  const cpuUsage = cpuMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
  const threadsCount = threadsMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
  const gcCount = gcMetrics?.measurements?.find((m: any) => m.statistic === 'COUNT')?.value || 0;
  const gcTotalTime = gcMetrics?.measurements?.find((m: any) => m.statistic === 'TOTAL_TIME')?.value || 0;
  const uptimeSeconds = uptimeMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
  const httpCount = httpMetrics?.measurements?.find((m: any) => m.statistic === 'COUNT')?.value || 0;

  return (
    <>
      {/* Métricas en Tiempo Real */}
      <section className="section-separator">
        <h3 className="section-title">
          <BarChart3 className="h-6 w-6 text-utec-purple" />
          Métricas JVM en Tiempo Real
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <MetricsChart
            title="Memoria"
            data={metricsHistory}
            dataKey="memory"
            icon={MemoryStick}
            color="#0066CC"
            unit=" bytes"
            type="area"
            height={250}
          />
          <MetricsChart
            title="CPU"
            data={metricsHistory}
            dataKey="cpu"
            icon={Cpu}
            color="#86bb4c"
            unit="%"
            type="area"
            height={250}
          />
          <MetricsChart
            title="Threads"
            data={metricsHistory}
            dataKey="threads"
            icon={Activity}
            color="#F6CA21"
            unit=""
            type="line"
            height={250}
          />
        </div>
      </section>

      {/* Tabla JVM Detallada */}
      <section className="section-separator">
        <h3 className="section-title">
          <Zap className="h-6 w-6 text-utec-yellow" />
          Detalle JVM
        </h3>

        <Card className="shadow-card">
          <CardContent className="p-4 sm:p-6">
            <Table>
              <TableHeader style={{ backgroundColor: '#525961' }}>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[#d1d5db]">Métrica</TableHead>
                  <TableHead className="text-[#d1d5db]">Valor</TableHead>
                  <TableHead className="text-[#d1d5db] hidden md:table-cell">Descripción</TableHead>
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
          </CardContent>
        </Card>
      </section>
    </>
  );
});
