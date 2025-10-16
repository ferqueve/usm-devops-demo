import { memo } from 'react';
import { Activity, MemoryStick, Cpu } from 'lucide-react';
import { MetricsChart } from '@/components/ui/metrics-chart';

interface JvmChartsProps {
  metricsHistory: any[];
  isPaused?: boolean;
}

export const JvmCharts = memo(function JvmCharts({ metricsHistory, isPaused = false }: JvmChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      <MetricsChart
        title="Memoria"
        data={metricsHistory}
        dataKey="memory"
        icon={MemoryStick}
        color="#0066CC"
        unit=" bytes"
        type="area"
        height={250}
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
        height={250}
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
        height={250}
        isPaused={isPaused}
      />
    </div>
  );
});
