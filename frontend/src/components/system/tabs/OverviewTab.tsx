import { memo } from 'react';
import { MetricsCards } from '../sections/MetricsCards';
import { ExternalServicesCard } from '../sections/ExternalServicesCard';
import { AppInfoCard } from '../sections/AppInfoCard';
import { ActiveUsersCard } from '../sections/ActiveUsersCard';
import type { AppInfo, HealthInfo, MetricInfo } from '@/lib/types/actuator';
import type { ActiveUsersStats } from '@/lib/types';

interface OverviewTabProps {
  health: HealthInfo | null | undefined;
  memoryMetrics: MetricInfo | null | undefined;
  memoryMaxMetrics: MetricInfo | null | undefined;
  cpuMetrics: MetricInfo | null | undefined;
  uptimeMetrics: MetricInfo | null | undefined;
  info: AppInfo | null | undefined;
  activeUsers: ActiveUsersStats | null;
}

export const OverviewTab = memo(function OverviewTab({
  health,
  memoryMetrics,
  memoryMaxMetrics,
  cpuMetrics,
  uptimeMetrics,
  info,
  activeUsers,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <section>
        <MetricsCards
          health={health}
          memoryMetrics={memoryMetrics}
          memoryMaxMetrics={memoryMaxMetrics}
          cpuMetrics={cpuMetrics}
          uptimeMetrics={uptimeMetrics}
        />
      </section>
      <section>
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
