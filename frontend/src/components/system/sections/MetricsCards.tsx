import { memo } from 'react';
import { CheckCircle2, AlertCircle, HardDrive, Cpu, Clock } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { formatBytes, formatUptime } from '@/lib/utils/formatters';
import type { HealthInfo, MetricInfo, MetricMeasurement } from '@/lib/types/actuator';

interface MetricsCardsProps {
  health: HealthInfo | null | undefined;
  memoryMetrics: MetricInfo | null | undefined;
  memoryMaxMetrics: MetricInfo | null | undefined;
  cpuMetrics: MetricInfo | null | undefined;
  uptimeMetrics: MetricInfo | null | undefined;
}

export const MetricsCards = memo(function MetricsCards({
  health,
  memoryMetrics,
  memoryMaxMetrics,
  cpuMetrics,
  uptimeMetrics
}: MetricsCardsProps) {
  const healthStatus = health?.status || 'UNKNOWN';
  const isHealthy = healthStatus === 'UP';
  
  const findStatistic = (metric: MetricInfo | null | undefined, stat: string): number =>
    metric?.measurements?.find((m: MetricMeasurement) => m.statistic === stat)?.value ?? 0;

  const memoryUsed = findStatistic(memoryMetrics, 'VALUE');
  const memoryMax = memoryMaxMetrics?.measurements?.find((m: MetricMeasurement) => m.statistic === 'VALUE')?.value ?? 2147483648;
  const memoryUsagePercent = memoryMax > 0 ? (memoryUsed / memoryMax) * 100 : 0;

  const cpuUsage = findStatistic(cpuMetrics, 'VALUE');
  const uptimeSeconds = findStatistic(uptimeMetrics, 'VALUE');

  const memoryVariant: 'error' | 'warning' | 'success' = (() => {
    if (memoryUsagePercent > 90) return 'error';
    if (memoryUsagePercent > 70) return 'warning';
    return 'success';
  })();

  const cpuVariant: 'error' | 'warning' | 'info' = (() => {
    if (cpuUsage > 0.9) return 'error';
    if (cpuUsage > 0.7) return 'warning';
    return 'info';
  })();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <MetricCard
        title="Estado de Salud"
        value={healthStatus}
        icon={isHealthy ? CheckCircle2 : AlertCircle}
        description={isHealthy ? 'Sistema operativo' : 'Verificar componentes'}
        variant={isHealthy ? 'success' : 'error'}
      />

      <MetricCard
        title="Memoria JVM"
        value={formatBytes(memoryUsed)}
        icon={HardDrive}
        description={`${memoryUsagePercent.toFixed(1)}% de ${formatBytes(memoryMax)}`}
        progress={memoryUsagePercent}
        variant={memoryVariant}
      />

      <MetricCard
        title="Uso de CPU"
        value={`${(cpuUsage * 100).toFixed(1)}%`}
        icon={Cpu}
        description="Procesamiento del sistema"
        progress={cpuUsage * 100}
        variant={cpuVariant}
      />

      <MetricCard
        title="Tiempo Activo"
        value={formatUptime(uptimeSeconds * 1000)}
        icon={Clock}
        description="Desde el último reinicio"
        variant="warning"
      />
    </div>
  );
});
