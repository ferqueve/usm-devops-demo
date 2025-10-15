import { memo } from 'react';
import { CheckCircle2, AlertCircle, HardDrive, Cpu, Clock } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { formatBytes, formatUptime } from '@/core/utils/formatters';

interface SystemMetricsProps {
  health: any;
  memoryMetrics: any;
  memoryMaxMetrics: any;
  cpuMetrics: any;
  uptimeMetrics: any;
}

export const SystemMetrics = memo(function SystemMetrics({
  health,
  memoryMetrics,
  memoryMaxMetrics,
  cpuMetrics,
  uptimeMetrics
}: SystemMetricsProps) {
  const healthStatus = health?.status || 'UNKNOWN';
  const isHealthy = healthStatus === 'UP';
  
  const memoryUsed = memoryMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
  const memoryMax = memoryMaxMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 2147483648;
  const memoryUsagePercent = memoryMax > 0 ? (memoryUsed / memoryMax) * 100 : 0;
  
  const cpuUsage = cpuMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
  const uptimeSeconds = uptimeMetrics?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
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
        variant={
          memoryUsagePercent > 90 ? 'error' : 
          memoryUsagePercent > 70 ? 'warning' : 
          'success'
        }
      />

      <MetricCard
        title="Uso de CPU"
        value={`${(cpuUsage * 100).toFixed(1)}%`}
        icon={Cpu}
        description="Procesamiento del sistema"
        progress={cpuUsage * 100}
        variant={
          cpuUsage > 0.9 ? 'error' : 
          cpuUsage > 0.7 ? 'warning' : 
          'info'
        }
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
