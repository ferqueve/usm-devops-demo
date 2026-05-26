import { memo } from 'react';
import { JvmCharts } from '../sections/JvmCharts';
import { JvmDetailsTable } from '../sections/JvmDetailsTable';
import { SlowEndpointsCard } from '../sections/SlowEndpointsCard';
import { useSidebarTransition } from '@/hooks/useSidebarTransition';
import type { MetricInfo } from '@/lib/types/actuator';
import type { MetricsChartDataPoint } from '@/components/ui/metrics-chart';

interface PerformanceTabProps {
  memoryMetrics: MetricInfo | null | undefined;
  memoryMaxMetrics: MetricInfo | null | undefined;
  cpuMetrics: MetricInfo | null | undefined;
  threadsMetrics: MetricInfo | null | undefined;
  gcMetrics: MetricInfo | null | undefined;
  uptimeMetrics: MetricInfo | null | undefined;
  httpMetrics: MetricInfo | null | undefined;
  metricsHistory: MetricsChartDataPoint[];
}

export const PerformanceTab = memo(function PerformanceTab({
  memoryMetrics,
  memoryMaxMetrics,
  cpuMetrics,
  threadsMetrics,
  gcMetrics,
  uptimeMetrics,
  httpMetrics,
  metricsHistory,
}: PerformanceTabProps) {
  const { isTransitioning } = useSidebarTransition();

  return (
    <div className="space-y-6">
      <section>
        <JvmCharts metricsHistory={metricsHistory} isPaused={isTransitioning} />
      </section>
      <section>
        <SlowEndpointsCard />
      </section>
      <section>
        <JvmDetailsTable
          memoryMetrics={memoryMetrics}
          memoryMaxMetrics={memoryMaxMetrics}
          cpuMetrics={cpuMetrics}
          threadsMetrics={threadsMetrics}
          gcMetrics={gcMetrics}
          uptimeMetrics={uptimeMetrics}
          httpMetrics={httpMetrics}
        />
      </section>
    </div>
  );
});
