import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import {
  Leaf,
  FileText,
  Cloud,
  Droplets,
  Files,
  Database,
  TreePine,
  Car,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSostenibilidad } from '@/hooks/useSostenibilidad';

const CHART_HEIGHT = 280;
const UTEC_GREEN = '#86bb4c';

interface TooltipPayload {
  name?: string;
  value?: number;
  color?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload?.length) {
    return (
      <div className="bg-utec-dark text-white border border-utec-dark/40 rounded-md shadow-lg px-2.5 py-1.5 text-xs">
        <p className="text-white/70 mb-0.5">{label}</p>
        {payload.map((entry, index: number) => {
          const p = entry as TooltipPayload;
          return (
            <p key={`${p.name ?? 'entry'}-${index}`} className="tabular-nums">
              <span style={{ color: p.color ?? UTEC_GREEN }}>●</span>{' '}
              <span className="font-semibold">{p.value?.toLocaleString('es-UY')}</span> hojas
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('es-UY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function SostenibilidadDashboard() {
  const { stats, loading, error } = useSostenibilidad();

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <Leaf className="mx-auto mb-3 h-10 w-10 text-utec-green/50" />
        <p>No se pudieron cargar las métricas de sostenibilidad.</p>
      </div>
    );
  }

  const ahorroData = stats.ahorroPorMes.map((p) => ({
    mes: p.mes,
    hojas: p.hojas,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-utec-green/10 text-utec-green">
          <Leaf className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sostenibilidad</h1>
          <p className="text-sm text-muted-foreground">
            Ahorro ambiental estimado por la digitalización de recursos académicos
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Papel ahorrado"
          value={`${formatNumber(stats.papelAhorradoKg, 1)} kg`}
          icon={FileText}
          variant="success"
          description="Papel que no se imprimió"
        />
        <MetricCard
          title="CO₂ evitado"
          value={`${formatNumber(stats.co2EvitadoKg, 1)} kg`}
          icon={Cloud}
          variant="success"
          description="Emisiones de carbono evitadas"
        />
        <MetricCard
          title="Agua ahorrada"
          value={`${formatNumber(stats.aguaAhorradaL)} L`}
          icon={Droplets}
          variant="success"
          description="Agua usada en producción de papel"
        />
        <MetricCard
          title="Hojas evitadas"
          value={formatNumber(stats.hojasEvitadas)}
          icon={Files}
          variant="success"
          description="Hojas de papel no impresas"
        />
        <MetricCard
          title="Recursos digitales"
          value={formatNumber(stats.recursosDigitalesTotales)}
          icon={Database}
          variant="success"
          description={`${formatNumber(stats.recursosArchivo)} archivos · ${formatNumber(stats.recursosEnlace)} enlaces`}
        />
      </div>

      {/* Equivalencias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equivalencias ambientales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white p-4">
              <div className="p-3 rounded-lg bg-white/80 text-utec-green shadow-sm">
                <TreePine className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  ≈ {formatNumber(stats.arbolesSalvados, 1)} árboles
                </p>
                <p className="text-xs text-muted-foreground">salvados por el papel ahorrado</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white p-4">
              <div className="p-3 rounded-lg bg-white/80 text-utec-green shadow-sm">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  ≈ {formatNumber(stats.kmAutoEquivalente)} km en auto
                </p>
                <p className="text-xs text-muted-foreground">equivalentes al CO₂ evitado</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ahorro por mes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hojas evitadas por mes</CardTitle>
        </CardHeader>
        <CardContent>
          {ahorroData.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aún no hay datos suficientes para mostrar la evolución mensual.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={ahorroData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(134, 187, 76, 0.08)' }} />
                <Bar dataKey="hojas" fill={UTEC_GREEN} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
