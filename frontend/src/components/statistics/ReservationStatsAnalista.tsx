import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import { espaciosApi } from '@/lib/api/spaces';
import { carrerasApi } from '@/lib/api/carreras';
import type { ReservaStats } from '@/lib/types/spaces';
import type { Espacio, Carrera } from '@/lib/types/spaces';
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
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { exportReservationStatsToPDF } from '@/lib/utils/pdf-export';
import ReservationCharts from './ReservationCharts';
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
        cantidad: cantidad as number,
        mesCompleto: mes
      }))
      .sort((a, b) => a.mesCompleto.localeCompare(b.mesCompleto));
  }, [stats?.reservasPorMes]);

  const reservasPorDiaSemanaData = useMemo(() => {
    if (!stats?.reservasPorDiaSemana) return [];
    const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return Object.entries(stats.reservasPorDiaSemana)
      .map(([dia, cantidad]) => ({
        dia,
        cantidad: cantidad as number,
        orden: diasOrden.indexOf(dia) !== -1 ? diasOrden.indexOf(dia) : 99
      }))
      .sort((a, b) => a.orden - b.orden);
  }, [stats?.reservasPorDiaSemana]);

  const reservasPorEspacioData = useMemo(() => {
    if (!stats?.reservasPorEspacio) return [];
    return Object.entries(stats.reservasPorEspacio)
      .map(([espacioId, cantidad]) => {
        const espacio = espacios.find(e => e.id === parseInt(espacioId));
        return {
          espacioId: parseInt(espacioId),
          nombre: espacio?.nombre || `Espacio ${espacioId}`,
          cantidad: cantidad as number
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
      
      // Encabezados
      csvRows.push('Métrica,Valor');
      csvRows.push(`Total Reservas,${stats.totalReservas}`);
      csvRows.push(`Aprobadas,${stats.totalAprobadas}`);
      csvRows.push(`Pendientes,${stats.totalPendientes}`);
      csvRows.push(`Canceladas,${stats.totalCanceladas}`);
      csvRows.push(`Futuras,${stats.totalFuturas}`);
      csvRows.push(`Pasadas,${stats.totalPasadas}`);
      csvRows.push(`Activas,${stats.totalActivas}`);
      csvRows.push(`Reservas Este Mes,${stats.reservasEsteMes}`);
      csvRows.push(`Reservas Próximo Mes,${stats.reservasProximoMes}`);
      csvRows.push(`Reservas Este Año,${stats.reservasEsteAnio}`);
      csvRows.push(`Promedio Mensual,${stats.promedioReservasPorMes.toFixed(2)}`);
      csvRows.push(`Promedio Semanal,${stats.promedioReservasPorSemana.toFixed(2)}`);
      csvRows.push(`Total Espacios Usados,${stats.totalEspaciosUsados}`);
      csvRows.push(`Espacio Más Usado,${stats.nombreEspacioMasUsado || 'N/A'}`);
      csvRows.push(`Duración Total (horas),${stats.duracionTotalHoras.toFixed(2)}`);
      csvRows.push(`Duración Promedio (horas),${stats.duracionPromedioHoras.toFixed(2)}`);
      csvRows.push(`Horas Reservadas Este Mes,${stats.horasReservadasEsteMes.toFixed(2)}`);
      
      // Reservas por mes
      if (stats.reservasPorMes && Object.keys(stats.reservasPorMes).length > 0) {
        csvRows.push('');
        csvRows.push('Reservas por Mes');
        csvRows.push('Mes,Cantidad');
        Object.entries(stats.reservasPorMes).forEach(([mes, cantidad]) => {
          csvRows.push(`${mes},${cantidad}`);
        });
      }
      
      // Reservas por día de semana
      if (stats.reservasPorDiaSemana && Object.keys(stats.reservasPorDiaSemana).length > 0) {
        csvRows.push('');
        csvRows.push('Reservas por Día de Semana');
        csvRows.push('Día,Cantidad');
        Object.entries(stats.reservasPorDiaSemana).forEach(([dia, cantidad]) => {
          csvRows.push(`${dia},${cantidad}`);
        });
      }
      
      // Reservas por espacio (top 10)
      if (stats.reservasPorEspacio && Object.keys(stats.reservasPorEspacio).length > 0) {
        csvRows.push('');
        csvRows.push('Reservas por Espacio (Top 10)');
        csvRows.push('Espacio ID,Cantidad');
        const sortedEspacios = Object.entries(stats.reservasPorEspacio)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 10);
        sortedEspacios.forEach(([espacioId, cantidad]) => {
          const espacio = espacios.find(e => e.id === parseInt(espacioId));
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
      document.body.removeChild(link);
      
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

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
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

  return (
    <div className="space-y-6">
      {/* Header con filtros y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Estadísticas de Reservas</h2>
          <p className="text-sm text-muted-foreground">
            Análisis completo de reservas del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <PermissionGuard requiredPermission="estadisticas:exportar">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Reservas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.reservasEsteAnio} este año
            </p>
          </CardContent>
        </Card>

        {/* Aprobadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalAprobadas}</div>
            <p className="text-xs text-muted-foreground">
              {porcentajeAprobadas}% del total
            </p>
          </CardContent>
        </Card>

        {/* Pendientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Hourglass className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.totalPendientes}</div>
            <p className="text-xs text-muted-foreground">
              {porcentajePendientes}% del total
            </p>
          </CardContent>
        </Card>

        {/* Canceladas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalCanceladas}</div>
            <p className="text-xs text-muted-foreground">
              {porcentajeCanceladas}% del total
            </p>
          </CardContent>
        </Card>

        {/* Reservas Este Mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reservasEsteMes}</div>
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon(stats.diferenciaMesAnterior)}
              <span className={getTrendColor(stats.diferenciaMesAnterior)}>
                {stats.diferenciaMesAnterior > 0 ? '+' : ''}{stats.diferenciaMesAnterior} vs mes anterior
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Próximo Mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Mes</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reservasProximoMes}</div>
            <p className="text-xs text-muted-foreground">
              Reservas programadas
            </p>
          </CardContent>
        </Card>

        {/* Duración Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración Total</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(stats.duracionTotalHoras)}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: {formatHours(stats.duracionPromedioHoras)}
            </p>
          </CardContent>
        </Card>

        {/* Espacios Usados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espacios Usados</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEspaciosUsados}</div>
            <p className="text-xs text-muted-foreground truncate">
              Más usado: {stats.nombreEspacioMasUsado || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Futuras</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFuturas}</div>
            <p className="text-xs text-muted-foreground">
              Reservas programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pasadas</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPasadas}</div>
            <p className="text-xs text-muted-foreground">
              Reservas completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalActivas}</div>
            <p className="text-xs text-muted-foreground">
              En curso ahora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Semanal</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.promedioReservasPorSemana.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.promedioReservasPorMes.toFixed(1)} por mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {stats && (
        <ReservationCharts 
          stats={stats}
          reservasPorMesData={reservasPorMesData}
          reservasPorDiaSemanaData={reservasPorDiaSemanaData}
          reservasPorEspacioData={reservasPorEspacioData}
          distribucionPorEstadoData={distribucionPorEstadoData}
        />
      )}

      {/* Tablas de datos detallados */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Espacios */}
        {reservasPorEspacioData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 10 Espacios Más Reservados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reservasPorEspacioData.map((espacio, index) => (
                  <div key={espacio.espacioId} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{espacio.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{espacio.cantidad}</span>
                      <span className="text-xs text-muted-foreground">reservas</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen de duración */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análisis de Duración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duración Total</span>
              <span className="font-semibold">{formatHours(stats.duracionTotalHoras)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duración Promedio</span>
              <span className="font-semibold">{formatHours(stats.duracionPromedioHoras)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reserva Más Larga</span>
              <span className="font-semibold">{formatHours(stats.reservaMasLargaHoras)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reserva Más Corta</span>
              <span className="font-semibold">{formatHours(stats.reservaMasCortaHoras)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Horas Este Mes</span>
              <span className="font-semibold text-blue-600">{formatHours(stats.horasReservadasEsteMes)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.mesConMasReservas && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Mes con Más Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mesConMasReservas}</div>
            </CardContent>
          </Card>
        )}
        
        {stats.fechaUltimaReserva && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Última Reserva</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold">
                {format(new Date(stats.fechaUltimaReserva), 'dd MMM yyyy, HH:mm', { locale: es })}
              </div>
              {stats.diasDesdeUltimaReserva !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Hace {stats.diasDesdeUltimaReserva} días
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {stats.fechaProximaReserva && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Próxima Reserva</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold">
                {format(new Date(stats.fechaProximaReserva), 'dd MMM yyyy, HH:mm', { locale: es })}
              </div>
              {stats.diasHastaProximaReserva !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  En {stats.diasHastaProximaReserva} días
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

