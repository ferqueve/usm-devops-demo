import { memo } from 'react';
import { CheckCircle2, AlertCircle, HardDrive, Cpu, Clock } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { formatBytes, formatUptime } from '@/lib/utils/formatters';

interface MetricsCardsProps {
  health: any;
  memoryMetrics: any;
  memoryMaxMetrics: any;
  cpuMetrics: any;
  uptimeMetrics: any;
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
  
  const memoryUsed = memoryMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
  const memoryMax = memoryMaxMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 2147483648;
  const memoryUsagePercent = memoryMax > 0 ? (memoryUsed / memoryMax) * 100 : 0;
  
  const cpuUsage = cpuMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
  const uptimeSeconds = uptimeMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;

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
