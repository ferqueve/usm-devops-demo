import { memo, useMemo } from 'react';
import { CheckCircle2, AlertCircle, HardDrive, Cpu, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatBytes, formatUptime } from '@/lib/utils/formatters';
import type { HealthInfo, MetricInfo, MetricMeasurement } from '@/lib/types/actuator';
import type { MetricsChartDataPoint } from '@/components/ui/metrics-chart';

interface MetricsCardsProps {
  health: HealthInfo | null | undefined;
  memoryMetrics: MetricInfo | null | undefined;
  memoryMaxMetrics: MetricInfo | null | undefined;
  cpuMetrics: MetricInfo | null | undefined;
  uptimeMetrics: MetricInfo | null | undefined;
  /** Serie de los últimos minutos, para el sparkline de memoria y CPU. */
  metricsHistory?: MetricsChartDataPoint[];
  /** Desde cuándo el estado de salud es el actual. */
  statusSince?: Date | null;
}

interface SysStatProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  progress?: number;
  /** Colorea la barra según el valor: verde, ámbar sobre 75, rojo sobre 90. */
  umbral?: boolean;
  serie?: number[];
  serieColor?: string;
  onClick?: () => void;
  tono?: 'normal' | 'alerta';
}

/** Sparkline: la última media hora en 60px. Dice más que el número solo. */
function Sparkline({ valores, color }: Readonly<{ valores: number[]; color: string }>) {
  if (valores.length < 2) return null;

  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const rango = max - min || 1;
  const puntos = valores
    .map((v, i) => {
      const x = (i / (valores.length - 1)) * 100;
      const y = 100 - ((v - min) / rango) * 100;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="mt-2 h-6 w-full"
      aria-hidden
    >
      <polyline
        points={puntos}
        fill="none"
        stroke={color}
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function colorDeUmbral(valor: number): string {
  if (valor >= 90) return 'bg-utec-red';
  if (valor >= 75) return 'bg-utec-yellow';
  return 'bg-utec-green';
}

function SysStat({
  label,
  value,
  hint,
  icon: Icon,
  progress,
  umbral,
  serie,
  serieColor = '#00c7ff',
  onClick,
  tono = 'normal',
}: Readonly<SysStatProps>) {
  const contenido = (
    <>
      <div className="flex items-center gap-1.5 text-xs mb-1 text-white/70">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${tono === 'alerta' ? 'text-utec-red' : 'text-white'}`}>
        {value}
      </div>
      {hint && <div className="text-[11px] mt-0.5 truncate text-white/60">{hint}</div>}
      {progress !== undefined && (
        <div className="h-1.5 mt-2 rounded-full bg-white/15 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${umbral ? colorDeUmbral(progress) : 'bg-utec-green'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      {serie && <Sparkline valores={serie} color={serieColor} />}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-xl bg-chrome p-4 min-w-0 text-left transition-colors hover:bg-utec-dark-lighter"
      >
        {contenido}
      </button>
    );
  }

  return <div className="rounded-xl p-4 min-w-0 bg-chrome">{contenido}</div>;
}

function desdeHace(desde: Date | null | undefined): string | null {
  if (!desde) return null;
  const segundos = Math.floor((Date.now() - desde.getTime()) / 1000);
  if (segundos < 60) return 'recién';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  return `hace ${Math.floor(minutos / 60)} h`;
}

export const MetricsCards = memo(function MetricsCards({
  health,
  memoryMetrics,
  memoryMaxMetrics,
  cpuMetrics,
  uptimeMetrics,
  metricsHistory = [],
  statusSince,
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

  // Un DOWN sin culpable no sirve: contamos qué componentes están caídos.
  const componentes = useMemo(() => {
    const entradas = Object.entries(health?.components ?? {});
    const caidos = entradas.filter(([, c]) => c?.status && c.status !== 'UP');
    return { total: entradas.length, caidos: caidos.map(([nombre]) => nombre) };
  }, [health?.components]);

  const detalleSalud = (() => {
    if (componentes.total === 0) return isHealthy ? 'Sistema operativo' : 'Verificar componentes';
    if (componentes.caidos.length === 0) {
      return `${componentes.total} componentes al día`;
    }
    return `${componentes.caidos.length} de ${componentes.total} caídos: ${componentes.caidos.join(', ')}`;
  })();

  const hace = desdeHace(statusSince);

  const serieMemoria = metricsHistory.slice(-30).map((p) => Number(p.memory) || 0);
  const serieCpu = metricsHistory.slice(-30).map((p) => Number(p.cpu) || 0);

  const irAServicios = () => {
    document.getElementById('servicios-dependencias')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <SysStat
        label="Estado de salud"
        value={healthStatus}
        hint={hace ? `${detalleSalud} · ${hace}` : detalleSalud}
        icon={isHealthy ? CheckCircle2 : AlertCircle}
        tono={isHealthy ? 'normal' : 'alerta'}
        onClick={componentes.total > 0 ? irAServicios : undefined}
      />
      <SysStat
        label="Memoria JVM"
        value={formatBytes(memoryUsed)}
        hint={`${memoryUsagePercent.toFixed(1)}% de ${formatBytes(memoryMax)}`}
        icon={HardDrive}
        progress={memoryUsagePercent}
        umbral
        serie={serieMemoria}
        serieColor="#00c7ff"
      />
      <SysStat
        label="Uso de CPU"
        value={`${(cpuUsage * 100).toFixed(1)}%`}
        hint="Procesamiento del sistema"
        icon={Cpu}
        progress={cpuUsage * 100}
        umbral
        serie={serieCpu}
        serieColor="#86bb4c"
      />
      <SysStat
        label="Tiempo activo"
        value={formatUptime(uptimeSeconds * 1000)}
        hint="Desde el último reinicio"
        icon={Clock}
      />
    </div>
  );
});
