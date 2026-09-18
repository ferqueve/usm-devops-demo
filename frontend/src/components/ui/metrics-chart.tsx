import { useState, useMemo, memo, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LucideIcon } from 'lucide-react';

export type MetricsChartDataPoint = Record<string, number | string | undefined> & {
  timestamp?: number | string;
  time?: string;
};

interface MetricsChartProps {
  title: string;
  data: MetricsChartDataPoint[];
  dataKey: string;
  icon?: LucideIcon;
  color?: string;
  unit?: string;
  type?: 'line' | 'area';
  height?: number;
  isPaused?: boolean; // Nueva prop para pausar animaciones
}

// Subcomponente: encabezado de la card (título + selectores).
// Extraído para evitar duplicar el header en los modos "paused" y "live".
interface MetricsChartHeaderProps {
  title: string;
  Icon?: LucideIcon;
  color: string;
  timeRange: number;
  yAxisMode: 'auto' | 'fixed';
  onTimeRangeChange: (val: number) => void;
  onYAxisModeChange: (val: 'auto' | 'fixed') => void;
}

function MetricsChartHeader({
  title,
  Icon,
  color,
  timeRange,
  yAxisMode,
  onTimeRangeChange,
  onYAxisModeChange,
}: Readonly<MetricsChartHeaderProps>) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-chrome text-white">
      <span className="w-1 h-4 rounded-sm shrink-0" style={{ backgroundColor: color }} aria-hidden />
      {Icon && <Icon className="h-3.5 w-3.5 text-white/70 shrink-0" />}
      <h3 className="text-sm font-semibold tracking-tight truncate flex-1">{title}</h3>
      <Select value={timeRange.toString()} onValueChange={(val) => onTimeRangeChange(Number(val))}>
        <SelectTrigger className="w-[85px] h-7 text-[11px] bg-white/10 border-white/20 text-white hover:bg-white/15">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="6">1 min</SelectItem>
          <SelectItem value="30">5 min</SelectItem>
          <SelectItem value="90">15 min</SelectItem>
          <SelectItem value="180">30 min</SelectItem>
          <SelectItem value="360">1 hora</SelectItem>
        </SelectContent>
      </Select>
      <Select value={yAxisMode} onValueChange={(val: 'auto' | 'fixed') => onYAxisModeChange(val)}>
        <SelectTrigger className="w-[85px] h-7 text-[11px] bg-white/10 border-white/20 text-white hover:bg-white/15">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Auto Y</SelectItem>
          <SelectItem value="fixed">Fijo Y</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export const MetricsChart = memo(function MetricsChart({
  title,
  data,
  dataKey,
  icon: Icon,
  color = '#0066CC',
  unit = '',
  type = 'area',
  height = 300,
  isPaused = false
}: MetricsChartProps) {
  const [timeRange, setTimeRange] = useState<number>(30);
  const [yAxisMode, setYAxisMode] = useState<'auto' | 'fixed'>('auto');

  // Filtrar datos según el rango de tiempo y optimizar para mejor rendimiento
  const displayData = useMemo(() => {
    const sliced = data.slice(-timeRange);
    // Si hay muchos puntos, reducir la resolución para mejor rendimiento
    if (sliced.length > 50) {
      const step = Math.ceil(sliced.length / 50);
      return sliced.filter((_, index) => index % step === 0);
    }
    return sliced;
  }, [data, timeRange]);

  // Calcular dominio del eje Y
  const yAxisDomain = useMemo(() => {
    if (yAxisMode === 'auto') {
      return ['auto', 'auto'];
    }
    // Para modo fijo, calcular min/max con margen
    const values = displayData.map((d) => Number(d[dataKey] ?? 0));
    const max = Math.max(...values);
    const min = Math.min(...values);
    const margin = (max - min) * 0.1 || 10;
    return [Math.max(0, min - margin), max + margin];
  }, [displayData, dataKey, yAxisMode]);

  // Tooltip personalizado - memoizado para evitar re-renders
  const CustomTooltip = useCallback(({ active, payload }: TooltipProps<ValueType, NameType>) => {
    if (active && payload?.length) {
      const first = payload[0];
      const numericValue = typeof first.value === 'number' ? first.value : Number(first.value ?? 0);
      const payloadObj = first.payload as MetricsChartDataPoint | undefined;
      const ts = payloadObj?.timestamp;
      return (
        <div className="bg-chrome border border-white/20 text-white rounded-md shadow-lg px-2.5 py-1.5 text-xs">
          <p className="font-semibold tabular-nums">
            {numericValue.toFixed(2)}{unit}
          </p>
          {ts !== undefined && (
            <p className="text-white/60">
              {new Date(ts).toLocaleTimeString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  }, [unit]);

  const header = (
    <MetricsChartHeader
      title={title}
      Icon={Icon}
      color={color}
      timeRange={timeRange}
      yAxisMode={yAxisMode}
      onTimeRangeChange={setTimeRange}
      onYAxisModeChange={setYAxisMode}
    />
  );

  // Si está pausado, mostrar versión estática optimizada
  if (isPaused) {
    return (
      <div className="rounded-xl border border-white/10 bg-chrome overflow-hidden">
        {header}
        <div className="p-4">
          <div className="flex items-center justify-center h-[180px] text-white/50">
            <div className="text-center">
              <div className="text-sm">Gráfico pausado</div>
              <div className="text-xs mt-1">Para optimizar rendimiento</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-chrome overflow-hidden">
      {header}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          {type === 'area' ? (
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.18)" />
              <XAxis
                dataKey="time"
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 11 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 11 }}
                tickFormatter={(value) => `${value.toFixed(0)}${unit}`}
                domain={yAxisDomain as [number | string, number | string]}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${dataKey})`}
                animationDuration={300}
                isAnimationActive={true}
              />
            </AreaChart>
          ) : (
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.18)" />
              <XAxis
                dataKey="time"
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 11 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 11 }}
                tickFormatter={(value) => `${value.toFixed(0)}${unit}`}
                domain={yAxisDomain as [number | string, number | string]}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                animationDuration={300}
                isAnimationActive={true}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
});
