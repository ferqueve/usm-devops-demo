import { memo } from 'react';
import { MetricsCards } from '../sections/MetricsCards';
import { ExternalServicesCard } from '../sections/ExternalServicesCard';
import { AppInfoCard } from '../sections/AppInfoCard';
import { ActiveUsersCard } from '../sections/ActiveUsersCard';
import { TrafficCard } from '../sections/TrafficCard';
import type { AppInfo, HealthInfo, MetricInfo } from '@/lib/types/actuator';
import type { ActiveUsersStats } from '@/lib/types';
import type { MetricsChartDataPoint } from '@/components/ui/metrics-chart';
import type { TrafficMetrics } from '@/hooks/useSystemMetrics';

interface OverviewTabProps {
  health: HealthInfo | null | undefined;
  memoryMetrics: MetricInfo | null | undefined;
  memoryMaxMetrics: MetricInfo | null | undefined;
  cpuMetrics: MetricInfo | null | undefined;
  uptimeMetrics: MetricInfo | null | undefined;
  info: AppInfo | null | undefined;
  activeUsers: ActiveUsersStats | null;
  traffic: TrafficMetrics | null | undefined;
  metricsHistory: MetricsChartDataPoint[];
  statusSince: Date | null;
}

export const OverviewTab = memo(function OverviewTab({
  health,
  memoryMetrics,
  memoryMaxMetrics,
  cpuMetrics,
  uptimeMetrics,
  info,
  activeUsers,
  traffic,
  metricsHistory,
  statusSince,
}: OverviewTabProps) {
  const uptimeSeconds = uptimeMetrics?.measurements?.find((m) => m.statistic === 'VALUE')?.value ?? 0;

  return (
    <div className="space-y-6">
      <section>
        <MetricsCards
          health={health}
          memoryMetrics={memoryMetrics}
          memoryMaxMetrics={memoryMaxMetrics}
          cpuMetrics={cpuMetrics}
          uptimeMetrics={uptimeMetrics}
          metricsHistory={metricsHistory}
          statusSince={statusSince}
        />
      </section>
      <section>
        <TrafficCard traffic={traffic} uptimeSeconds={uptimeSeconds} />
      </section>
      {/* El id ancla el tile de salud: al tocarlo, baja hasta acá. */}
      <section id="servicios-dependencias" className="scroll-mt-24">
        <ExternalServicesCard health={health} />
      </section>
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
          <AppInfoCard info={info} />
          <ActiveUsersCard data={activeUsers} />
        </div>
      </section>
    </div>
  );
});
