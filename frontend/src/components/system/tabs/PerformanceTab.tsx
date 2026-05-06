import { memo } from 'react';
import { BarChart3, Settings } from 'lucide-react';
import { JvmCharts } from '../sections/JvmCharts';
import { JvmDetailsTable } from '../sections/JvmDetailsTable';
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
  metricsHistory
}: PerformanceTabProps) {
  const { isTransitioning } = useSidebarTransition();

  return (
    <div className="space-y-6">
      {/* Gráficos JVM - Pausados durante transición del sidebar */}
      <section>
        <h3 className="section-title mb-4">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-utec-cyan" />
            Métricas JVM en Tiempo Real
          </span>
        </h3>
        <JvmCharts metricsHistory={metricsHistory} isPaused={isTransitioning} />
      </section>

      {/* Tabla detallada JVM */}
      <section>
        <h3 className="section-title mb-4">
          <span className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-utec-yellow" />
            Detalle JVM
          </span>
        </h3>
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
