import { memo } from 'react';
import { MetricsCards } from '../sections/MetricsCards';
import { AppInfoCard } from '../sections/AppInfoCard';
import { ActiveUsersCard } from '../sections/ActiveUsersCard';
import { JvmCharts } from '../sections/JvmCharts';
import { useSidebarTransition } from '@/hooks/useSidebarTransition';
import type { AppInfo, HealthInfo, MetricInfo } from '@/lib/types/actuator';
import type { ActiveUsersStats } from '@/lib/types';
import type { MetricsChartDataPoint } from '@/components/ui/metrics-chart';

interface OverviewTabProps {
  health: HealthInfo | null | undefined;
  memoryMetrics: MetricInfo | null | undefined;
  memoryMaxMetrics: MetricInfo | null | undefined;
  cpuMetrics: MetricInfo | null | undefined;
  uptimeMetrics: MetricInfo | null | undefined;
  info: AppInfo | null | undefined;
  activeUsers: ActiveUsersStats | null;
  metricsHistory: MetricsChartDataPoint[];
}

export const OverviewTab = memo(function OverviewTab({
  health,
  memoryMetrics,
  memoryMaxMetrics,
  cpuMetrics,
  uptimeMetrics,
  info,
  activeUsers,
  metricsHistory
}: OverviewTabProps) {
  const { isTransitioning } = useSidebarTransition();

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <section>
        <MetricsCards
          health={health}
          memoryMetrics={memoryMetrics}
          memoryMaxMetrics={memoryMaxMetrics}
          cpuMetrics={cpuMetrics}
          uptimeMetrics={uptimeMetrics}
        />
      </section>

      {/* Información de la app y usuarios activos */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <AppInfoCard info={info} />
          <ActiveUsersCard data={activeUsers} />
        </div>
      </section>

      {/* Gráficos JVM (solo los gráficos, sin tabla) - Pausados durante transición del sidebar */}
      <section>
        <JvmCharts metricsHistory={metricsHistory} isPaused={isTransitioning} />
      </section>
    </div>
  );
});
