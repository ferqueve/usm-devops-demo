import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import type { ReservaStats } from '@/lib/types/spaces';
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
} from 'lucide-react';

interface ReservationStatsProps {
  onRefresh?: () => void;
}

export default function ReservationStats({ onRefresh }: ReservationStatsProps) {
  const [stats, setStats] = useState<ReservaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [isVerticalLayout, setIsVerticalLayout] = useState(false);

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
  }, [isVerticalLayout, collapsed]);

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
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-7 w-7 bg-gray-200 rounded"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2 h-10 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
          <div className="h-px bg-gray-200"></div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2 h-10 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
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
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  // Componente unificado para todas las métricas - más compacto
  const MetricItem = ({ label, value, icon, fullWidth, collapsed }: { label: string; value: React.ReactNode; icon?: React.ReactNode; fullWidth?: boolean; collapsed?: boolean }) => {
    if (collapsed) {
      return (
        <div className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
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
  };

  // Separador visual para grupos de métricas
  const SectionDivider = () => <div className="col-span-2 border-t my-2"></div>;

  // Título de sección
  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-sm font-semibold text-muted-foreground mb-3 col-span-2">{title}</h3>
  );

  // En modo vertical, forzar que siempre esté extendido
  const isCollapsed = isVerticalLayout ? false : collapsed;

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
                icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                collapsed={true}
              />
              <MetricItem
                label="Pendientes"
                value={stats.totalPendientes}
                icon={<Hourglass className="h-3.5 w-3.5 text-yellow-600" />}
                collapsed={true}
              />
              <MetricItem
                label="Canceladas"
                value={stats.totalCanceladas}
                icon={<XCircle className="h-3.5 w-3.5 text-red-600" />}
                collapsed={true}
              />
              <MetricItem
                label="Futuras"
                value={stats.totalFuturas}
                icon={<Calendar className="h-3.5 w-3.5 text-blue-600" />}
                collapsed={true}
              />
              <MetricItem
                label="Pasadas"
                value={stats.totalPasadas}
                icon={<Clock className="h-3.5 w-3.5 text-gray-600" />}
                collapsed={true}
              />
              <MetricItem
                label="Activas"
                value={stats.totalActivas}
                icon={<Activity className="h-3.5 w-3.5 text-green-600" />}
                collapsed={true}
              />
            </div>
            
            {/* Actividad Temporal - colapsado en 2 columnas */}
            <div className="border-t pt-3 pb-3">
              <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                <MetricItem
                  label="Este Mes"
                  value={stats.reservasEsteMes}
                  icon={<Calendar className="h-3.5 w-3.5 text-blue-600" />}
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
                  icon={<Clock className="h-3.5 w-3.5 text-blue-600" />}
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
                  icon={<MapPin className="h-3.5 w-3.5 text-green-600" />}
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
                    value={<span className="text-blue-600">{stats.diasHastaProximaReserva}d</span>}
                    icon={<Calendar className="h-3.5 w-3.5 text-blue-600" />}
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
            value={<span className="text-green-600">{stats.totalAprobadas}</span>} 
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
            collapsed={false}
          />
          <MetricItem 
            label="Pendientes" 
            value={<span className="text-yellow-600">{stats.totalPendientes}</span>} 
            icon={<Hourglass className="h-3.5 w-3.5 text-yellow-600" />}
            collapsed={false}
          />
          <MetricItem 
            label="Canceladas" 
            value={<span className="text-red-600">{stats.totalCanceladas}</span>} 
            icon={<XCircle className="h-3.5 w-3.5 text-red-600" />}
            collapsed={false}
          />
          <MetricItem 
            label="Futuras" 
            value={<span className="text-blue-600">{stats.totalFuturas}</span>} 
            icon={<Calendar className="h-3.5 w-3.5 text-blue-600" />}
            collapsed={false}
          />
          <MetricItem 
            label="Pasadas" 
            value={stats.totalPasadas} 
            icon={<Clock className="h-3.5 w-3.5 text-gray-600" />}
            collapsed={false}
          />
          <MetricItem 
            label="Activas" 
            value={<span className="text-green-600">{stats.totalActivas}</span>} 
            icon={<Activity className="h-3.5 w-3.5 text-green-600" />}
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
            icon={<Calendar className="h-3.5 w-3.5 text-blue-600" />}
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
            icon={<Clock className="h-3.5 w-3.5 text-blue-600" />}
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
            icon={<MapPin className="h-3.5 w-3.5 text-green-600" />}
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
                  value={<span className="text-blue-600">{stats.diasHastaProximaReserva} días</span>} 
                  icon={<Calendar className="h-3.5 w-3.5 text-blue-600" />}
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

