import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import { espaciosApi } from '@/lib/api/spaces';
import { carrerasApi } from '@/lib/api/carreras';
import type { ReservaStats, Espacio, Carrera } from '@/lib/types/spaces';
import PermissionGuard from '@/components/auth/PermissionGuard';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Hourglass,
  Clock,
  MapPin,
  BarChart3,
  RefreshCw,
  FileDown,
  Activity,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import { StatStrip } from '@/components/dashboard/views/_components/StatStrip';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportReservationStatsToPDF } from '@/lib/utils/pdf-export';
import ReservationCharts from './ReservationCharts';
import EstadisticasAvanzadas from './EstadisticasAvanzadas';
import { AiStatsBanner } from './AiStatsBanner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReservationStatsAnalista() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReservaStats | null>(null);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  
  // Filtros (aunque las estadísticas vienen del backend, podemos filtrar visualmente)
  const [filterEspacio] = useState<number | null>(null);
  const [filterCarrera] = useState<number | null>(null);

  // Cargar datos para filtros
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [espaciosRes, carrerasRes] = await Promise.all([
          espaciosApi.obtenerEspacios(),
          carrerasApi.obtenerCarreras(),
        ]);
        
        if (espaciosRes.data) setEspacios(espaciosRes.data);
        if (carrerasRes.data) setCarreras(carrerasRes.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar datos', {
          description: 'No se pudieron cargar los datos de filtros'
        });
      }
    };
    fetchData();
  }, []);

  // Obtener estadísticas del backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await reservationsApi.obtenerEstadisticasPersonales();
        
        if (response.data) {
          setStats(response.data);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las estadísticas';
        console.error('Error al cargar estadísticas:', error);
        toast.error('Error al cargar estadísticas', {
          description: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Preparar datos para gráficos (debe estar antes de cualquier early return)
  const reservasPorMesData = useMemo(() => {
    if (!stats?.reservasPorMes) return [];
    return Object.entries(stats.reservasPorMes)
      .map(([mes, cantidad]) => ({
        mes: mes.length > 7 ? mes.substring(0, 7) : mes,
        cantidad,
        mesCompleto: mes
      }))
      .sort((a, b) => a.mesCompleto.localeCompare(b.mesCompleto));
  }, [stats?.reservasPorMes]);

  const reservasPorDiaSemanaData = useMemo(() => {
    if (!stats?.reservasPorDiaSemana) return [];
    // El backend devuelve DayOfWeek de Java (MONDAY..SUNDAY en MAYÚSCULAS inglés).
    // Mapeamos al label en español y mantenemos el orden Lun..Dom.
    const diaMap: Record<string, { label: string; orden: number }> = {
      MONDAY: { label: 'Lunes', orden: 0 },
      TUESDAY: { label: 'Martes', orden: 1 },
      WEDNESDAY: { label: 'Miércoles', orden: 2 },
      THURSDAY: { label: 'Jueves', orden: 3 },
      FRIDAY: { label: 'Viernes', orden: 4 },
      SATURDAY: { label: 'Sábado', orden: 5 },
      SUNDAY: { label: 'Domingo', orden: 6 },
    };
    return Object.entries(stats.reservasPorDiaSemana)
      .map(([dia, cantidad]) => {
        const info = diaMap[dia.toUpperCase()];
        return {
          dia: info?.label ?? dia,
          cantidad,
          orden: info?.orden ?? 99,
        };
      })
      .sort((a, b) => a.orden - b.orden);
  }, [stats?.reservasPorDiaSemana]);

  const reservasPorEspacioData = useMemo(() => {
    if (!stats?.reservasPorEspacio) return [];
    return Object.entries(stats.reservasPorEspacio)
      .map(([espacioId, cantidad]) => {
        const espacio = espacios.find(e => e.id === Number.parseInt(espacioId));
        return {
          espacioId: Number.parseInt(espacioId),
          nombre: espacio?.nombre || `Espacio ${espacioId}`,
          cantidad
        };
      })
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }, [stats?.reservasPorEspacio, espacios]);

  const distribucionPorEstadoData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Aprobadas', value: stats.totalAprobadas, color: '#10b981' },
      { name: 'Pendientes', value: stats.totalPendientes, color: '#f59e0b' },
      { name: 'Canceladas', value: stats.totalCanceladas, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [stats]);

  const handleExportPDF = () => {
    if (!stats) {
      toast.error('No hay datos para exportar');
      return;
    }
    try {
      exportReservationStatsToPDF(stats, {
        espacioNombre: filterEspacio ? espacios.find(e => e.id === filterEspacio)?.nombre : undefined,
        carreraNombre: filterCarrera ? carreras.find(c => c.id === filterCarrera)?.nombre : undefined,
      });
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error('Error al exportar PDF', {
        description: error instanceof Error ? error.message : 'No se pudo generar el PDF'
      });
    }
  };

  const handleExportCSV = () => {
    if (!stats) {
      toast.error('No hay datos para exportar');
      return;
    }
    try {
      // Crear CSV con datos principales
      const csvRows: string[] = [];
      
      // Encabezados y totales
      csvRows.push(
        'Métrica,Valor',
        `Total Reservas,${stats.totalReservas}`,
        `Aprobadas,${stats.totalAprobadas}`,
        `Pendientes,${stats.totalPendientes}`,
        `Canceladas,${stats.totalCanceladas}`,
        `Futuras,${stats.totalFuturas}`,
        `Pasadas,${stats.totalPasadas}`,
        `Activas,${stats.totalActivas}`,
        `Reservas Este Mes,${stats.reservasEsteMes}`,
        `Reservas Próximo Mes,${stats.reservasProximoMes}`,
        `Reservas Este Año,${stats.reservasEsteAnio}`,
        `Promedio Mensual,${stats.promedioReservasPorMes.toFixed(2)}`,
        `Promedio Semanal,${stats.promedioReservasPorSemana.toFixed(2)}`,
        `Total Espacios Usados,${stats.totalEspaciosUsados}`,
        `Espacio Más Usado,${stats.nombreEspacioMasUsado || 'N/A'}`,
        `Duración Total (horas),${stats.duracionTotalHoras.toFixed(2)}`,
        `Duración Promedio (horas),${stats.duracionPromedioHoras.toFixed(2)}`,
        `Horas Reservadas Este Mes,${stats.horasReservadasEsteMes.toFixed(2)}`,
      );
      
      // Reservas por mes
      if (stats.reservasPorMes && Object.keys(stats.reservasPorMes).length > 0) {
        csvRows.push('', 'Reservas por Mes', 'Mes,Cantidad');
        Object.entries(stats.reservasPorMes).forEach(([mes, cantidad]) => {
          csvRows.push(`${mes},${cantidad}`);
        });
      }
      
      // Reservas por día de semana
      if (stats.reservasPorDiaSemana && Object.keys(stats.reservasPorDiaSemana).length > 0) {
        csvRows.push('', 'Reservas por Día de Semana', 'Día,Cantidad');
        Object.entries(stats.reservasPorDiaSemana).forEach(([dia, cantidad]) => {
          csvRows.push(`${dia},${cantidad}`);
        });
      }

      // Reservas por espacio (top 10)
      if (stats.reservasPorEspacio && Object.keys(stats.reservasPorEspacio).length > 0) {
        csvRows.push('', 'Reservas por Espacio (Top 10)', 'Espacio ID,Cantidad');
        const sortedEspacios = Object.entries(stats.reservasPorEspacio)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);
        sortedEspacios.forEach(([espacioId, cantidad]) => {
          const espacio = espacios.find(e => e.id === Number.parseInt(espacioId));
          csvRows.push(`${espacio?.nombre || espacioId},${cantidad}`);
        });
      }
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `estadisticas_reservas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('CSV exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      toast.error('Error al exportar CSV', {
        description: error instanceof Error ? error.message : 'No se pudo generar el CSV'
      });
    }
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours === Math.floor(hours)) return `${Math.floor(hours)}h`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}min`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((skeletonKey) => (
            <Card key={skeletonKey} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
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

  // Calcular porcentajes
  const porcentajeAprobadas = stats.totalReservas > 0 
    ? ((stats.totalAprobadas / stats.totalReservas) * 100).toFixed(1)
    : '0';
  const porcentajePendientes = stats.totalReservas > 0 
    ? ((stats.totalPendientes / stats.totalReservas) * 100).toFixed(1)
    : '0';
  const porcentajeCanceladas = stats.totalReservas > 0 
    ? ((stats.totalCanceladas / stats.totalReservas) * 100).toFixed(1)
    : '0';

  const actionsSlot = typeof document !== 'undefined'
    ? document.getElementById('stats-actions-slot')
    : null;
  const actions = (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => globalThis.location.reload()}
            aria-label="Actualizar"
            className="h-9 w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Actualizar</TooltipContent>
      </Tooltip>
      <PermissionGuard requiredPermission="estadisticas:ver_reservas">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              <FileDown className="h-4 w-4 mr-1.5" />
              Exportar
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PermissionGuard>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Si existe el slot en el header de tabs (vista admin), portalizar; si no, renderizar inline. */}
      {actionsSlot
        ? createPortal(actions, actionsSlot)
        : <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}

      {/* Resumen IA del estado actual de las reservas */}
      <AiStatsBanner stats={stats} />

      {/* Strip principal con colores institucionales UTEC */}
      <StatStrip
        items={[
          { label: 'Total', value: stats.totalReservas, hint: `${stats.reservasEsteAnio} este año`, icon: BarChart3, bg: 'dark' },
          { label: 'Aprobadas', value: stats.totalAprobadas, hint: `${porcentajeAprobadas}% del total`, icon: CheckCircle2, bg: 'green' },
          { label: 'Pendientes', value: stats.totalPendientes, hint: `${porcentajePendientes}% del total`, icon: Hourglass, bg: 'yellow' },
          { label: 'Canceladas', value: stats.totalCanceladas, hint: `${porcentajeCanceladas}% del total`, icon: XCircle, bg: 'red' },
          { label: 'Este mes', value: stats.reservasEsteMes, hint: `${stats.diferenciaMesAnterior > 0 ? '+' : ''}${stats.diferenciaMesAnterior} vs anterior`, icon: Calendar, bg: 'blue' },
          { label: 'Próximo mes', value: stats.reservasProximoMes, hint: 'programadas', icon: TrendingUp, bg: 'cyan' },
        ]}
      />

      {/* Strip secundario más compacto */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 text-sm">
        {[
          { label: 'Futuras', value: stats.totalFuturas, icon: Calendar },
          { label: 'Pasadas', value: stats.totalPasadas, icon: Clock },
          { label: 'Activas', value: stats.totalActivas, icon: Activity, accent: 'text-utec-yellow' },
          { label: 'Espacios usados', value: stats.totalEspaciosUsados, icon: MapPin },
          { label: 'Duración total', value: formatHours(stats.duracionTotalHoras), icon: Clock },
          { label: 'Prom. semanal', value: stats.promedioReservasPorSemana.toFixed(1), icon: BarChart3 },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-lg bg-utec-dark text-white px-3 py-2 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-white/60 mb-0.5">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </div>
            <div className={`text-lg font-semibold tabular-nums ${accent ?? ''}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      {stats && (
        <ReservationCharts
          reservasPorMesData={reservasPorMesData}
          reservasPorDiaSemanaData={reservasPorDiaSemanaData}
          reservasPorEspacioData={reservasPorEspacioData}
          distribucionPorEstadoData={distribucionPorEstadoData}
        />
      )}

      {/* Top espacios + extremos de duración, compactos */}
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        {reservasPorEspacioData.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
              <span className="w-1 h-4 rounded-sm bg-utec-yellow shrink-0" />
              <h3 className="text-sm font-semibold tracking-tight">Top 10 espacios más reservados</h3>
            </div>
            <div className="divide-y divide-border/60">
              {reservasPorEspacioData.map((espacio, index) => (
                <div key={espacio.espacioId} className="flex items-center justify-between px-4 py-1.5 text-sm hover:bg-muted/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5 text-right tabular-nums">{index + 1}.</span>
                    <span className="truncate">{espacio.nombre}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{espacio.cantidad}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
            <span className="w-1 h-4 rounded-sm bg-utec-blue shrink-0" />
            <h3 className="text-sm font-semibold tracking-tight">Duración</h3>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Más larga</div>
              <div className="font-semibold tabular-nums">{formatHours(stats.reservaMasLargaHoras)}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Más corta</div>
              <div className="font-semibold tabular-nums">{formatHours(stats.reservaMasCortaHoras)}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Promedio</div>
              <div className="font-semibold tabular-nums">{formatHours(stats.duracionPromedioHoras)}</div>
            </div>
            <div className="col-span-3 pt-2 border-t flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Horas este mes</span>
              <span className="font-semibold text-utec-blue tabular-nums">{formatHours(stats.horasReservadasEsteMes)}</span>
            </div>
          </div>
          <div className="px-4 py-2 border-t bg-muted/30 grid grid-cols-3 gap-3 text-xs">
            {stats.mesConMasReservas && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Mes pico</div>
                <div className="font-semibold tabular-nums">{stats.mesConMasReservas}</div>
              </div>
            )}
            {stats.fechaUltimaReserva && (
              <div className="truncate">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Última</div>
                <div className="font-semibold truncate" title={format(new Date(stats.fechaUltimaReserva), 'dd MMM yyyy, HH:mm', { locale: es })}>
                  {format(new Date(stats.fechaUltimaReserva), 'dd MMM HH:mm', { locale: es })}
                </div>
              </div>
            )}
            {stats.fechaProximaReserva && (
              <div className="truncate">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Próxima</div>
                <div className="font-semibold truncate" title={format(new Date(stats.fechaProximaReserva), 'dd MMM yyyy, HH:mm', { locale: es })}>
                  {format(new Date(stats.fechaProximaReserva), 'dd MMM HH:mm', { locale: es })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Métricas avanzadas alimentadas desde la capa analítica (tablas de hechos) */}
      <EstadisticasAvanzadas />
    </div>
  );
}

