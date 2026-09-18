import { memo } from 'react';
import { Activity, MemoryStick, Cpu } from 'lucide-react';
import { MetricsChart, type MetricsChartDataPoint } from '@/components/ui/metrics-chart';
import { MARCA } from '@/lib/design/paleta';

interface JvmChartsProps {
  metricsHistory: MetricsChartDataPoint[];
  isPaused?: boolean;
}

export const JvmCharts = memo(function JvmCharts({ metricsHistory, isPaused = false }: JvmChartsProps) {
  // La serie se arma en vivo (una muestra cada 10s) y sobrevive a cambiar de
  // vista, pero la primera vez arranca casi vacía: mejor decirlo que mostrar
  // un gráfico de un punto sin explicación.
  const recolectando = metricsHistory.length < 6;

  return (
    <div className="space-y-4">
      {recolectando && (
        <p className="rounded-lg border border-dashed px-4 py-2.5 text-xs text-muted-foreground">
          Recolectando muestras: {metricsHistory.length} de 6 para dibujar la tendencia. Se toma una cada
          10 segundos y el historial se guarda mientras dure la sesión.
        </p>
      )}
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
        color={MARCA.verde}
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
        color={MARCA.amarillo}
        unit=""
        type="line"
        height={180}
        isPaused={isPaused}
      />
    </div>
  );
});
