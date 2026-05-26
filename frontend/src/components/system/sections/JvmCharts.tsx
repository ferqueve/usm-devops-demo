import { memo } from 'react';
import { Activity, MemoryStick, Cpu } from 'lucide-react';
import { MetricsChart, type MetricsChartDataPoint } from '@/components/ui/metrics-chart';

interface JvmChartsProps {
  metricsHistory: MetricsChartDataPoint[];
  isPaused?: boolean;
}

export const JvmCharts = memo(function JvmCharts({ metricsHistory, isPaused = false }: JvmChartsProps) {
  return (
    <div className="space-y-4">
      <MetricsChart
        title="Memoria"
        data={metricsHistory}
        dataKey="memory"
        icon={MemoryStick}
        color="#0066CC"
        unit=" MB"
        type="area"
        height={180}
        isPaused={isPaused}
      />
      <MetricsChart
        title="CPU"
        data={metricsHistory}
        dataKey="cpu"
        icon={Cpu}
        color="#86bb4c"
        unit="%"
        type="area"
        height={180}
        isPaused={isPaused}
      />
      <MetricsChart
        title="Threads"
        data={metricsHistory}
        dataKey="threads"
        icon={Activity}
        color="#F6CA21"
        unit=""
        type="line"
        height={180}
        isPaused={isPaused}
      />
    </div>
  );
});
