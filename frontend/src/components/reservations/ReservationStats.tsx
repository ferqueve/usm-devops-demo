import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { reservationsApi } from '@/lib/api/reservations';
import type { ReservaStats } from '@/lib/types/spaces';
import type { LucideIcon } from 'lucide-react';
import { MARCA } from '@/lib/design/paleta';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Hourglass,
  Calendar,
  Clock,
  MapPin,
  TrendingUp as Activity,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  PieChart as PieChartIcon,
} from 'lucide-react';

type UtecBg = 'blue' | 'yellow' | 'green' | 'orange' | 'red' | 'cyan' | 'dark';

const bgClasses: Record<UtecBg, { bg: string; text: string; subtle: string }> = {
  blue:   { bg: 'bg-utec-blue',   text: 'text-white',     subtle: 'text-white/70' },
  yellow: { bg: 'bg-utec-yellow', text: 'text-marca-tinta', subtle: 'text-marca-tinta/70' },
  green:  { bg: 'bg-utec-green',  text: 'text-marca-tinta',     subtle: 'text-marca-tinta/80' },
  orange: { bg: 'bg-utec-orange', text: 'text-marca-tinta',     subtle: 'text-marca-tinta/80' },
  red:    { bg: 'bg-utec-red',    text: 'text-white',     subtle: 'text-white/80' },
  cyan:   { bg: 'bg-utec-cyan',   text: 'text-marca-tinta', subtle: 'text-marca-tinta/70' },
  dark:   { bg: 'bg-chrome',   text: 'text-white',     subtle: 'text-white/60' },
};

interface ColoredStatProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  bg: UtecBg;
}

function ColoredStat({ label, value, hint, icon: Icon, bg }: Readonly<ColoredStatProps>) {
  const c = bgClasses[bg];
  return (
    <div className={`rounded-xl p-3 min-w-0 ${c.bg}`}>
      <div className={`flex items-center gap-1.5 text-xs mb-1 ${c.subtle}`}>
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-xl font-semibold tabular-nums ${c.text}`}>{value}</div>
      {hint && <div className={`text-2xs mt-0.5 truncate ${c.subtle}`}>{hint}</div>}
    </div>
  );
}

const ESTADO_COLOR: Record<'Aprobadas' | 'Pendientes' | 'Canceladas', string> = {
  Aprobadas: MARCA.verde,
  Pendientes: MARCA.amarillo,
  Canceladas: MARCA.rojo,
};

interface TooltipPayload {
  name?: string;
  value?: number;
  color?: string;
  payload?: { color?: string; fill?: string };
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload?.length) {
    return (
      <div className="bg-chrome text-white border border-utec-dark/40 rounded-md shadow-lg px-2.5 py-1.5 text-xs">
        {payload.map((entry, index) => {
          const p = entry as TooltipPayload;
          const color = p.color ?? p.payload?.fill;
          return (
            <p key={`${p.name ?? 'entry'}-${index}`} className="tabular-nums">
              <span style={{ color }}>●</span>{' '}
              <span className="text-white/70">{p.name}:</span>{' '}
              <span className="font-semibold">{p.value}</span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
}

interface EstadoDonutProps {
  stats: ReservaStats;
}

function EstadoDonut({ stats }: Readonly<EstadoDonutProps>) {
  const data = [
    { name: 'Aprobadas', value: stats.totalAprobadas, color: ESTADO_COLOR.Aprobadas },
    { name: 'Pendientes', value: stats.totalPendientes, color: ESTADO_COLOR.Pendientes },
    { name: 'Canceladas', value: stats.totalCanceladas, color: ESTADO_COLOR.Canceladas },
  ].filter(d => d.value > 0);

  const total = stats.totalReservas;

  return (
    <div className="rounded-xl border bg-card overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-chrome text-white">
        <span className="w-1 h-4 rounded-sm shrink-0 bg-utec-green" aria-hidden />
        <PieChartIcon className="h-3.5 w-3.5 text-white/70 shrink-0" />
        <h3 className="text-sm font-semibold tracking-tight truncate">Distribución por estado</h3>
      </div>
      <div className="p-3 flex-1 flex items-center gap-3">
        <div className="w-[45%] shrink-0">
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={32}
                outerRadius={58}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 flex flex-col gap-1.5 text-xs min-w-0">
          {data.map((d) => {
            const pct = total === 0 ? 0 : Math.round((d.value / total) * 100);
            return (
              <li key={d.name} className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
                <span className="text-muted-foreground truncate flex-1">{d.name}</span>
                <span className="font-semibold tabular-nums shrink-0">{d.value}</span>
                <span className="text-muted-foreground tabular-nums shrink-0 w-9 text-right">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  collapsed?: boolean;
}

function MetricItem({ label, value, icon, fullWidth, collapsed }: Readonly<MetricItemProps>) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors">
        <div className="text-muted-foreground mb-1">
          {icon}
        </div>
        <div className="text-sm font-semibold text-center leading-tight truncate w-full">
          {value}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${fullWidth ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-base font-semibold leading-tight">{value}</span>
    </div>
  );
}

function SectionDivider() {
  return <div className="col-span-2 border-t my-2"></div>;
}

function SectionTitle({ title }: Readonly<{ title: string }>) {
  return <h3 className="text-sm font-semibold text-muted-foreground mb-3 col-span-2">{title}</h3>;
}

interface ReservationStatsProps {
  onRefresh?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  horizontal?: boolean; // Modo horizontal para cuando está arriba
}

export default function ReservationStats({ 
  onRefresh,
  collapsed: externalCollapsed,
  onCollapsedChange,
  horizontal = false
}: Readonly<ReservationStatsProps>) {
  const [stats, setStats] = useState<ReservaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isVerticalLayout, setIsVerticalLayout] = useState(false);
  
  // Usar el estado externo si está disponible, sino usar el interno
  const collapsed = externalCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange || setInternalCollapsed;

  // Detectar cuando el layout está en vertical (menor a lg breakpoint)
  useEffect(() => {
    const checkLayout = () => {
      setIsVerticalLayout(window.innerWidth < 1024); // lg breakpoint de Tailwind
    };

    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  // Cuando cambia a modo vertical, asegurar que siempre esté extendido
  useEffect(() => {
    if (isVerticalLayout && collapsed) {
      setCollapsed(false);
    }
  }, [isVerticalLayout, collapsed, setCollapsed]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await reservationsApi.obtenerEstadisticasPersonales();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error: unknown) {
      console.error('Error al cargar estadísticas:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las estadísticas';
      toast.error('Error al cargar estadísticas', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (onRefresh) {
      // El padre puede llamar a fetchStats directamente a través de onRefresh
      // Aquí solo nos aseguramos de refrescar cuando cambia algo
    }
  }, [onRefresh]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-secondary rounded w-32"></div>
            <div className="h-7 w-7 bg-secondary rounded"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2 h-10 bg-secondary rounded"></div>
            <div className="h-6 bg-secondary rounded"></div>
            <div className="h-6 bg-secondary rounded"></div>
            <div className="h-6 bg-secondary rounded"></div>
            <div className="h-6 bg-secondary rounded"></div>
          </div>
          <div className="h-px bg-secondary"></div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2 h-10 bg-secondary rounded"></div>
            <div className="h-6 bg-secondary rounded"></div>
            <div className="h-6 bg-secondary rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Error al cargar estadísticas
        </CardContent>
      </Card>
    );
  }

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours === Math.floor(hours)) return `${Math.floor(hours)}h`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}min`;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-success-texto';
    if (value < 0) return 'text-danger-texto';
    return 'text-muted-foreground';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-success-texto" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-danger-texto" />;
    return null;
  };

  // En modo vertical o horizontal, forzar que siempre esté extendido
  const isCollapsed = (isVerticalLayout || horizontal) ? false : collapsed;

  // Modo horizontal: layout estilo /users (tiles dark a la izquierda + donut a la derecha)
  if (horizontal) {
    const aprobacionPct = stats.totalReservas === 0
      ? 0
      : Math.round((stats.totalAprobadas / stats.totalReservas) * 100);
    const deltaMes = stats.diferenciaMesAnterior;
    const esteMesHint = deltaMes === 0
      ? 'igual que el mes anterior'
      : `${deltaMes > 0 ? '+' : ''}${deltaMes} vs anterior`;

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Izquierda: 6 stat cards dark en grid 2x3 / 3x2 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ColoredStat
            label="Pendientes"
            value={stats.totalPendientes}
            hint="a revisar"
            icon={Hourglass}
            bg="dark"
          />
          <ColoredStat
            label="Activas ahora"
            value={stats.totalActivas}
            hint="en curso"
            icon={Activity}
            bg="dark"
          />
          <ColoredStat
            label="Este mes"
            value={stats.reservasEsteMes}
            hint={esteMesHint}
            icon={Calendar}
            bg="dark"
          />
          <ColoredStat
            label="Aprobación"
            value={`${aprobacionPct}%`}
            hint={`${stats.totalAprobadas} aprobadas`}
            icon={CheckCircle2}
            bg="dark"
          />
          <ColoredStat
            label="Espacios usados"
            value={stats.totalEspaciosUsados}
            hint={stats.nombreEspacioMasUsado ? `top: ${stats.nombreEspacioMasUsado}` : undefined}
            icon={MapPin}
            bg="dark"
          />
          <ColoredStat
            label="Duración total"
            value={formatHours(stats.duracionTotalHoras)}
            hint="horas reservadas"
            icon={Clock}
            bg="dark"
          />
        </div>

        {/* Derecha: donut de distribución por estado */}
        <EstadoDonut stats={stats} />
      </div>
    );
  }

  return (
    <Card className={`h-fit overflow-hidden transition-all duration-500 ease-in-out ${
      isCollapsed 
        ? 'w-20 max-w-20' 
        : 'w-full lg:w-[328px] lg:max-w-[328px] lg:sticky lg:top-6'
    }`}>
      <CardHeader className={isCollapsed ? "pb-2 px-2" : "pb-3"}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(false)}
              className="h-6 w-6 p-0"
              title="Expandir"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Estadísticas</CardTitle>
            {!isVerticalLayout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(true)}
                className="h-7 w-7 p-0"
                title="Colapsar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <div className={`animate-fade-in-up ${isCollapsed ? 'animate-stagger-children-fast' : 'animate-stagger-children'}`}>
        {isCollapsed ? (
          <CardContent className="px-2 pb-2">
            {/* Resumen General - colapsado en 2 columnas */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 mb-3">
              <MetricItem
                label="Total"
                value={stats.totalReservas}
                icon={<BarChart3 className="h-3.5 w-3.5" />}
                collapsed={true}
              />
              <MetricItem
                label="Aprobadas"
                value={stats.totalAprobadas}
                icon={<CheckCircle2 className="h-3.5 w-3.5 text-success-texto" />}
                collapsed={true}
              />
              <MetricItem
                label="Pendientes"
                value={stats.totalPendientes}
                icon={<Hourglass className="h-3.5 w-3.5 text-warning-texto" />}
                collapsed={true}
              />
              <MetricItem
                label="Canceladas"
                value={stats.totalCanceladas}
                icon={<XCircle className="h-3.5 w-3.5 text-danger-texto" />}
                collapsed={true}
              />
              <MetricItem
                label="Futuras"
                value={stats.totalFuturas}
                icon={<Calendar className="h-3.5 w-3.5 text-info-texto" />}
                collapsed={true}
              />
              <MetricItem
                label="Pasadas"
                value={stats.totalPasadas}
                icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                collapsed={true}
              />
              <MetricItem
                label="Activas"
                value={stats.totalActivas}
                icon={<Activity className="h-3.5 w-3.5 text-success-texto" />}
                collapsed={true}
              />
            </div>
            
            {/* Actividad Temporal - colapsado en 2 columnas */}
            <div className="border-t pt-3 pb-3">
              <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                <MetricItem
                  label="Este Mes"
                  value={stats.reservasEsteMes}
                  icon={<Calendar className="h-3.5 w-3.5 text-info-texto" />}
                  collapsed={true}
                />
                <MetricItem
                  label="Próximo Mes"
                  value={stats.reservasProximoMes}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  collapsed={true}
                />
                <MetricItem
                  label="Este Año"
                  value={stats.reservasEsteAnio}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  collapsed={true}
                />
                <MetricItem
                  label="Prom. Mensual"
                  value={stats.promedioReservasPorMes.toFixed(1)}
                  icon={<BarChart3 className="h-3.5 w-3.5" />}
                  collapsed={true}
                />
                <MetricItem
                  label="Prom. Semanal"
                  value={stats.promedioReservasPorSemana.toFixed(1)}
                  icon={<BarChart3 className="h-3.5 w-3.5" />}
                  collapsed={true}
                />
              </div>
            </div>

            {/* Uso y Espacios - colapsado en 2 columnas */}
            <div className="border-t pt-3">
              <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                <MetricItem
                  label="Duración Total"
                  value={formatHours(stats.duracionTotalHoras)}
                  icon={<Clock className="h-3.5 w-3.5 text-info-texto" />}
                  collapsed={true}
                />
                <MetricItem
                  label="Duración Promedio"
                  value={formatHours(stats.duracionPromedioHoras)}
                  icon={<Clock className="h-3.5 w-3.5" />}
                  collapsed={true}
                />
                <MetricItem
                  label="Espacios Usados"
                  value={stats.totalEspaciosUsados}
                  icon={<MapPin className="h-3.5 w-3.5 text-success-texto" />}
                  collapsed={true}
                />
                {stats.nombreEspacioMasUsado && (
                  <MetricItem
                    label="Más Usado"
                    value={<span className="text-xs truncate">{stats.nombreEspacioMasUsado}</span>}
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    collapsed={true}
                  />
                )}
                {stats.diasDesdeUltimaReserva !== null && (
                  <MetricItem
                    label="Última reserva"
                    value={`${stats.diasDesdeUltimaReserva}d`}
                    icon={<Clock className="h-3.5 w-3.5" />}
                    collapsed={true}
                  />
                )}
                {stats.diasHastaProximaReserva !== null && (
                  <MetricItem
                    label="Próxima reserva"
                    value={<span className="text-info-texto">{stats.diasHastaProximaReserva}d</span>}
                    icon={<Calendar className="h-3.5 w-3.5 text-info-texto" />}
                    collapsed={true}
                  />
                )}
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent className="space-y-6">
        {/* Sección 1: Resumen General */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <SectionTitle title="Resumen General" />
          <MetricItem 
            label="Total Reservas" 
            value={<span className="text-xl">{stats.totalReservas}</span>} 
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            fullWidth
            collapsed={false}
          />
          <SectionDivider />
          <MetricItem 
            label="Aprobadas" 
            value={<span className="text-success-texto">{stats.totalAprobadas}</span>} 
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-success-texto" />}
            collapsed={false}
          />
          <MetricItem 
            label="Pendientes" 
            value={<span className="text-warning-texto">{stats.totalPendientes}</span>} 
            icon={<Hourglass className="h-3.5 w-3.5 text-warning-texto" />}
            collapsed={false}
          />
          <MetricItem 
            label="Canceladas" 
            value={<span className="text-danger-texto">{stats.totalCanceladas}</span>} 
            icon={<XCircle className="h-3.5 w-3.5 text-danger-texto" />}
            collapsed={false}
          />
          <MetricItem 
            label="Futuras" 
            value={<span className="text-info-texto">{stats.totalFuturas}</span>} 
            icon={<Calendar className="h-3.5 w-3.5 text-info-texto" />}
            collapsed={false}
          />
          <MetricItem 
            label="Pasadas" 
            value={stats.totalPasadas} 
            icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
            collapsed={false}
          />
          <MetricItem 
            label="Activas" 
            value={<span className="text-success-texto">{stats.totalActivas}</span>} 
            icon={<Activity className="h-3.5 w-3.5 text-success-texto" />}
            collapsed={false}
          />
        </div>

        {/* Sección 2: Actividad Temporal */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <SectionTitle title="Actividad Temporal" />
          <MetricItem 
            label="Este Mes" 
            value={
              <div className="flex items-center gap-1.5">
                <span>{stats.reservasEsteMes}</span>
                {stats.diferenciaMesAnterior !== 0 && (
                  <div className="flex items-center gap-0.5">
                    {getTrendIcon(stats.diferenciaMesAnterior)}
                    <span className={`text-xs ${getTrendColor(stats.diferenciaMesAnterior)}`}>
                      {stats.diferenciaMesAnterior > 0 ? '+' : ''}{stats.diferenciaMesAnterior}
                    </span>
                  </div>
                )}
              </div>
            } 
            icon={<Calendar className="h-3.5 w-3.5 text-info-texto" />}
            fullWidth
            collapsed={false}
          />
          <SectionDivider />
          <MetricItem 
            label="Próximo Mes" 
            value={stats.reservasProximoMes} 
            icon={<Calendar className="h-3.5 w-3.5" />}
            collapsed={false}
          />
          <MetricItem 
            label="Este Año" 
            value={stats.reservasEsteAnio} 
            icon={<Calendar className="h-3.5 w-3.5" />}
            collapsed={false}
          />
          <MetricItem 
            label="Prom. Mensual" 
            value={stats.promedioReservasPorMes.toFixed(1)} 
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            collapsed={false}
          />
          <MetricItem 
            label="Prom. Semanal" 
            value={stats.promedioReservasPorSemana.toFixed(1)} 
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            collapsed={false}
          />
        </div>

        {/* Sección 3: Uso y Espacios */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <SectionTitle title="Uso y Espacios" />
          <MetricItem 
            label="Duración Total" 
            value={formatHours(stats.duracionTotalHoras)} 
            icon={<Clock className="h-3.5 w-3.5 text-info-texto" />}
            fullWidth
            collapsed={false}
          />
          <SectionDivider />
          <MetricItem 
            label="Duración Promedio" 
            value={formatHours(stats.duracionPromedioHoras)} 
            icon={<Clock className="h-3.5 w-3.5" />}
            collapsed={false}
          />
          <MetricItem 
            label="Espacios Usados" 
            value={stats.totalEspaciosUsados} 
            icon={<MapPin className="h-3.5 w-3.5 text-success-texto" />}
            collapsed={false}
          />
          {stats.nombreEspacioMasUsado && (
            <MetricItem 
              label="Más Usado" 
              value={<span className="text-xs font-normal truncate">{stats.nombreEspacioMasUsado}</span>} 
              icon={<MapPin className="h-3.5 w-3.5" />}
              fullWidth
              collapsed={false}
            />
          )}
          {(stats.diasDesdeUltimaReserva !== null || stats.diasHastaProximaReserva !== null) && (
            <>
              <SectionDivider />
              {stats.diasDesdeUltimaReserva !== null && (
                <MetricItem 
                  label="Última reserva" 
                  value={`${stats.diasDesdeUltimaReserva} días`} 
                  icon={<Clock className="h-3.5 w-3.5" />}
                  collapsed={false}
                />
              )}
              {stats.diasHastaProximaReserva !== null && (
                <MetricItem 
                  label="Próxima reserva" 
                  value={<span className="text-info-texto">{stats.diasHastaProximaReserva} días</span>} 
                  icon={<Calendar className="h-3.5 w-3.5 text-info-texto" />}
                  collapsed={false}
                />
              )}
            </>
          )}
        </div>
      </CardContent>
        )}
      </div>
    </Card>
  );
}

