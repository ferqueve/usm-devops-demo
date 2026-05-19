import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { BarChart3, CalendarDays, PieChart as PieIcon } from 'lucide-react';

interface ReservationChartsProps {
  reservasPorMesData: Array<{ mes: string; cantidad: number; mesCompleto: string }>;
  reservasPorDiaSemanaData: Array<{ dia: string; cantidad: number; orden: number }>;
  reservasPorEspacioData: Array<{ espacioId: number; nombre: string; cantidad: number }>;
  distribucionPorEstadoData: Array<{ name: string; value: number; color: string }>;
}

interface TooltipPayload {
  name?: string;
  value?: number;
  color?: string;
}

const CHART_HEIGHT = 220;

// Colores UTEC institucionales para mapear los estados que vienen del backend.
const COLOR_OVERRIDE: Record<string, string> = {
  Aprobadas: '#86bb4c',
  Pendientes: '#F6CA21',
  Canceladas: '#DF2B31',
};

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload?.length) {
    return (
      <div className="bg-utec-dark text-white border border-utec-dark/40 rounded-md shadow-lg px-2.5 py-1.5 text-xs">
        {payload.map((entry, index: number) => {
          const p = entry as TooltipPayload;
          return (
            <p key={`${p.name ?? 'entry'}-${index}`} className="tabular-nums">
              <span style={{ color: p.color }}>●</span>{' '}
              <span className="text-white/70">{p.name}:</span>{' '}
              <span className="font-semibold">{p.value}</span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

interface SectionHeaderProps {
  title: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SectionHeader({ title, accent, icon: Icon }: Readonly<SectionHeaderProps>) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
      <span className="w-1 h-4 rounded-sm shrink-0" style={{ backgroundColor: accent }} aria-hidden />
      <Icon className="h-3.5 w-3.5 text-white/70 shrink-0" />
      <h3 className="text-sm font-semibold tracking-tight truncate">{title}</h3>
    </div>
  );
}

export default function ReservationCharts({
  reservasPorMesData,
  reservasPorDiaSemanaData,
  distribucionPorEstadoData,
}: Readonly<ReservationChartsProps>) {
  const totalEstados = distribucionPorEstadoData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Distribución por estado */}
      {distribucionPorEstadoData.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <SectionHeader title="Distribución por estado" accent="#86bb4c" icon={PieIcon} />
          <div className="p-3 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={distribucionPorEstadoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {distribucionPorEstadoData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={COLOR_OVERRIDE[entry.name] ?? entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="grid grid-cols-3 gap-2 w-full mt-1 text-xs">
              {distribucionPorEstadoData.map((d) => {
                const pct = totalEstados === 0 ? 0 : Math.round((d.value / totalEstados) * 100);
                return (
                  <li key={d.name} className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-sm shrink-0"
                        style={{ background: COLOR_OVERRIDE[d.name] ?? d.color }}
                      />
                      <span className="text-muted-foreground truncate">{d.name}</span>
                    </div>
                    <div className="font-semibold tabular-nums">{pct}%</div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Tendencia mensual */}
      {reservasPorMesData.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <SectionHeader title="Tendencia mensual" accent="#184897" icon={BarChart3} />
          <div className="p-3">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={reservasPorMesData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#184897"
                  strokeWidth={2}
                  dot={{ fill: '#184897', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Día de la semana */}
      {reservasPorDiaSemanaData.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <SectionHeader title="Reservas por día de semana" accent="#F6CA21" icon={CalendarDays} />
          <div className="p-3">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={reservasPorDiaSemanaData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  tickFormatter={(v: string) => v.slice(0, 3)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(24,72,151,0.08)' }} />
                <Bar dataKey="cantidad" fill="#F6CA21" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
