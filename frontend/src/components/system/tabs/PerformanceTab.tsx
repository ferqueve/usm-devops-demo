import { memo } from 'react';
import { JvmCharts } from '../sections/JvmCharts';
import { JvmDetailsTable } from '../sections/JvmDetailsTable';
import { useSidebarTransition } from '@/hooks/useSidebarTransition';

interface PerformanceTabProps {
  memoryMetrics: any;
  memoryMaxMetrics: any;
  cpuMetrics: any;
  threadsMetrics: any;
  gcMetrics: any;
  uptimeMetrics: any;
  httpMetrics: any;
  metricsHistory: any[];
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
    <div className="space-y-4 sm:space-y-6">
      {/* Gráficos JVM - Pausados durante transición del sidebar */}
      <section>
        <h3 className="section-title mb-4">
          <span className="flex items-center gap-2">
            📊 Métricas JVM en Tiempo Real
          </span>
        </h3>
        <JvmCharts metricsHistory={metricsHistory} isPaused={isTransitioning} />
      </section>

      {/* Tabla detallada JVM */}
      <section>
        <h3 className="section-title mb-4">
          <span className="flex items-center gap-2">
            ⚙️ Detalle JVM
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
