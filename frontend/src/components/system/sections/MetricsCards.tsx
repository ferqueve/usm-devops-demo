import { memo } from 'react';
import { CheckCircle2, AlertCircle, HardDrive, Cpu, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatBytes, formatUptime } from '@/lib/utils/formatters';
import type { HealthInfo, MetricInfo, MetricMeasurement } from '@/lib/types/actuator';

interface MetricsCardsProps {
  health: HealthInfo | null | undefined;
  memoryMetrics: MetricInfo | null | undefined;
  memoryMaxMetrics: MetricInfo | null | undefined;
  cpuMetrics: MetricInfo | null | undefined;
  uptimeMetrics: MetricInfo | null | undefined;
}

interface SysStatProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  progress?: number;
}

function SysStat({ label, value, hint, icon: Icon, progress }: Readonly<SysStatProps>) {
  return (
    <div className="rounded-xl p-4 min-w-0 bg-utec-dark">
      <div className="flex items-center gap-1.5 text-xs mb-1 text-white/70">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums text-white">{value}</div>
      {hint && <div className="text-[11px] mt-0.5 truncate text-white/60">{hint}</div>}
      {progress !== undefined && (
        <div className="h-1.5 mt-2 rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full bg-utec-green transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <SysStat
        label="Estado de Salud"
        value={healthStatus}
        hint={isHealthy ? 'Sistema operativo' : 'Verificar componentes'}
        icon={isHealthy ? CheckCircle2 : AlertCircle}
      />
      <SysStat
        label="Memoria JVM"
        value={formatBytes(memoryUsed)}
        hint={`${memoryUsagePercent.toFixed(1)}% de ${formatBytes(memoryMax)}`}
        icon={HardDrive}
        progress={memoryUsagePercent}
      />
      <SysStat
        label="Uso de CPU"
        value={`${(cpuUsage * 100).toFixed(1)}%`}
        hint="Procesamiento del sistema"
        icon={Cpu}
        progress={cpuUsage * 100}
      />
      <SysStat
        label="Tiempo Activo"
        value={formatUptime(uptimeSeconds * 1000)}
        hint="Desde el último reinicio"
        icon={Clock}
      />
    </div>
  );
});
