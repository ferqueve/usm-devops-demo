import { useState, useMemo, memo, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [timeRange, setTimeRange] = useState<number>(20);
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
        <div className="bg-white border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">
            {numericValue.toFixed(2)}{unit}
          </p>
          {ts !== undefined && (
            <p className="text-xs text-muted-foreground">
              {new Date(ts).toLocaleTimeString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  }, [unit]);

  // Si está pausado, mostrar versión estática optimizada
  if (isPaused) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base flex-shrink-0">
              {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />}
              <span className="truncate">{title}</span>
            </CardTitle>
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
              <Select value={timeRange.toString()} onValueChange={(val) => setTimeRange(Number(val))}>
                <SelectTrigger className="w-[85px] sm:w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 pts</SelectItem>
                  <SelectItem value="20">20 pts</SelectItem>
                  <SelectItem value="30">30 pts</SelectItem>
                  <SelectItem value="50">50 pts</SelectItem>
                </SelectContent>
              </Select>
              <Select value={yAxisMode} onValueChange={(val: 'auto' | 'fixed') => setYAxisMode(val)}>
                <SelectTrigger className="w-[85px] sm:w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Y</SelectItem>
                  <SelectItem value="fixed">Fijo Y</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            <div className="text-center">
              <div className="text-sm opacity-50">Gráfico pausado</div>
              <div className="text-xs mt-1">Para optimizar rendimiento</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover-lift">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base flex-shrink-0">
            {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />}
            <span className="truncate">{title}</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            <Select value={timeRange.toString()} onValueChange={(val) => setTimeRange(Number(val))}>
              <SelectTrigger className="w-[85px] sm:w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 pts</SelectItem>
                <SelectItem value="20">20 pts</SelectItem>
                <SelectItem value="30">30 pts</SelectItem>
                <SelectItem value="50">50 pts</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yAxisMode} onValueChange={(val: 'auto' | 'fixed') => setYAxisMode(val)}>
              <SelectTrigger className="w-[85px] sm:w-[100px] h-7 sm:h-8 text-[10px] sm:text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto Y</SelectItem>
                <SelectItem value="fixed">Fijo Y</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {type === 'area' ? (
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value.toFixed(0)}${unit}`}
                domain={yAxisDomain as [number | string, number | string]}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value.toFixed(0)}${unit}`}
                domain={yAxisDomain as [number | string, number | string]}
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
      </CardContent>
    </Card>
  );
});

