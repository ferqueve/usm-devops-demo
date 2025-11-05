import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { espaciosApi } from '@/lib/api/spaces';
import type { TipoElemento, Espacio } from '@/lib/types/spaces';
import {
  Package,
  CheckCircle2,
  AlertCircle,
  Wrench,
  MapPin,
  Boxes,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  Building2,
  Layers,
  Zap,
  FileDown,
  Calendar,
  Clock,
  Activity,
  AlertTriangle,
  Target,
  Shield,
  ShieldAlert,
  Info,
  FileText,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportInventoryStatsToPDF } from '@/lib/utils/pdf-export';

interface InventoryStats {
  // === TOTALES Y BÁSICAS ===
  totalItems: number;
  totalCantidad: number;
  disponibles: number;
  mantenimiento: number;
  danados: number;
  sinAsignar: number;
  asignados: number;
  itemsInactivos: number;
  
  // === PORCENTAJES ===
  porcentajeDisponibles: number;
  porcentajeMantenimiento: number;
  porcentajeDanados: number;
  porcentajeSinAsignar: number;
  porcentajeAsignados: number;
  porcentajeInactivos: number;
  
  // === POR TIPO DE ELEMENTO ===
  itemsPorTipo: Array<{ tipoNombre: string; tipoId: number; cantidad: number; items: number; disponibles: number; mantenimiento: number; danados: number }>;
  tiposUnicos: number;
  
  // === POR ESPACIO ===
  itemsPorEspacio: Array<{ espacioNombre: string; espacioId: number; cantidad: number; items: number; disponibles: number; mantenimiento: number; danados: number }>;
  espaciosConInventario: number;
  
  // === TOP RANKINGS ===
  topEspacios: Array<{ espacioNombre: string; espacioId: number; cantidad: number; items: number }>;
  topTipos: Array<{ tipoNombre: string; tipoId: number; cantidad: number; items: number }>;
  espaciosConMasProblemas: Array<{ espacioNombre: string; espacioId: number; problemas: number; porcentaje: number }>;
  tiposConMasProblemas: Array<{ tipoNombre: string; tipoId: number; problemas: number; porcentaje: number }>;
  
  // === PROMEDIOS ===
  promedioItemsPorEspacio: number;
  promedioCantidadPorItem: number;
  promedioItemsPorTipo: number;
  promedioCantidadPorEspacio: number;
  promedioCantidadPorTipo: number;
  
  // === ANÁLISIS TEMPORAL ===
  itemsCreadosEsteMes: number;
  itemsCreadosEsteAnio: number;
  itemsCreadosUltimos6Meses: number;
  itemsCreadosUltimos12Meses: number;
  itemsActualizadosEsteMes: number;
  itemsActualizadosUltimos7Dias: number;
  
  // === ANÁLISIS DE EDAD ===
  itemsRecientes: number;
  itemsJovenes: number;
  itemsViejos: number;
  promedioAntiguedadDias: number;
  promedioTiempoSinActualizarDias: number;
  itemsSinActualizarMasDe6Meses: number;
  
  // === SALUD DEL INVENTARIO ===
  ratioSalud: number;
  ratioProblemas: number;
  ratioAsignacion: number;
  indiceCobertura: number;
  
  // === ITEMS CRÍTICOS ===
  itemsCriticos: number;
  itemsSinAsignarConProblemas: number;
  espaciosSinInventario: number;
  tiposSinItems: number;
  
  // === ANÁLISIS DE DISTRIBUCIÓN ===
  espaciosConSoloDisponibles: number;
  espaciosConSoloMantenimiento: number;
  espaciosConSoloDanados: number;
  espaciosConMezclaEstados: number;
  tiposConSoloDisponibles: number;
  tiposConSoloMantenimiento: number;
  tiposConSoloDanados: number;
  tiposConMezclaEstados: number;
  
  // === ANÁLISIS DE CANTIDAD ===
  itemsConCantidad1: number;
  itemsConCantidadAlta: number;
  itemsConCantidadMedia: number;
  cantidadMaxima: number;
  cantidadMinima: number;
  cantidadTotalPromedio: number;
  
  // === ESTADÍSTICAS DE OBSERVACIONES ===
  itemsConObservaciones: number;
  itemsSinObservaciones: number;
  porcentajeConObservaciones: number;
  
  // === COMPARATIVAS ===
  diferenciaMesAnterior: number;
  porcentajeCambioMesAnterior: number;
  diferenciaAnioAnterior: number;
  porcentajeCambioAnioAnterior: number;
  
  // === EFICIENCIA ===
  eficienciaAsignacion: number;
  densidadInventario: number;
  concentracionInventario: number;
}

export default function InventoryStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [tiposElemento, setTiposElemento] = useState<TipoElemento[]>([]);
  
  // Filtros
  const [filterEspacio, setFilterEspacio] = useState<number | null>(null);
  const [filterTipoElemento, setFilterTipoElemento] = useState<number | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  // Cargar espacios y tipos para los filtros
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [espaciosRes, tiposRes] = await Promise.all([
          espaciosApi.obtenerEspacios(),
          espaciosApi.listarTiposElemento(),
        ]);
        
        if (espaciosRes.data) setEspacios(espaciosRes.data);
        if (tiposRes.data) setTiposElemento(tiposRes.data);
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
        const response = await espaciosApi.obtenerEstadisticasDetalladasInventario(
          filterEspacio,
          filterTipoElemento,
          filterEstado
        );
        
        if (response.data) {
          setStats(response.data as InventoryStats);
        }
      } catch (error: any) {
        console.error('Error al cargar estadísticas:', error);
        toast.error('Error al cargar estadísticas', {
          description: error.message || 'No se pudieron cargar las estadísticas'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [filterEspacio, filterTipoElemento, filterEstado]);

  const handleClearFilters = () => {
    setFilterEspacio(null);
    setFilterTipoElemento(null);
    setFilterEstado('todos');
  };

  const hayFiltrosActivos = filterEspacio !== null || filterTipoElemento !== null || filterEstado !== 'todos';

  const handleExport = () => {
    if (!stats) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      // Obtener nombres de los filtros aplicados
      const espacioNombre = filterEspacio 
        ? espacios.find(e => e.id === filterEspacio)?.nombre 
        : undefined;
      const tipoElementoNombre = filterTipoElemento 
        ? tiposElemento.find(t => t.id === filterTipoElemento)?.nombre 
        : undefined;

      exportInventoryStatsToPDF(stats, {
        espacioNombre,
        tipoElementoNombre,
        estado: filterEstado !== 'todos' ? filterEstado : undefined,
      });

      toast.success('PDF generado exitosamente', {
        description: 'El reporte se ha descargado correctamente'
      });
    } catch (error: any) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar PDF', {
        description: error.message || 'No se pudo generar el archivo PDF'
      });
    }
  };

  const handleRefresh = async () => {
    try {
      const response = await espaciosApi.obtenerEstadisticasDetalladasInventario(
        filterEspacio,
        filterTipoElemento,
        filterEstado
      );
      
      if (response.data) {
        setStats(response.data as InventoryStats);
        toast.success('Datos actualizados');
      }
    } catch (error) {
      toast.error('Error al actualizar datos');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-64"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No hay datos disponibles
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Estadísticas de Inventario</h2>
          <p className="text-muted-foreground">
            Análisis completo y detallado del inventario disponible
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros de Consulta</CardTitle>
            {hayFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Espacio</label>
              <Select 
                value={filterEspacio?.toString() || 'todos'} 
                onValueChange={(value) => setFilterEspacio(value === 'todos' ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los espacios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los espacios</SelectItem>
                  {espacios.map(espacio => (
                    <SelectItem key={espacio.id} value={espacio.id.toString()}>
                      {espacio.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Elemento</label>
              <Select 
                value={filterTipoElemento?.toString() || 'todos'} 
                onValueChange={(value) => setFilterTipoElemento(value === 'todos' ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {tiposElemento.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                  <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                  <SelectItem value="DANADO">Dañado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas principales - 8 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCantidad} unidades totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.disponibles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.porcentajeDisponibles.toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Mantenimiento</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.mantenimiento}</div>
            <p className="text-xs text-muted-foreground">
              {stats.porcentajeMantenimiento.toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dañados</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.danados}</div>
            <p className="text-xs text-muted-foreground">
              {stats.porcentajeDanados.toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignados</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.asignados}</div>
            <p className="text-xs text-muted-foreground">
              {stats.espaciosConInventario} espacios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Asignar</CardTitle>
            <Boxes className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sinAsignar}</div>
            <p className="text-xs text-muted-foreground">
              {stats.porcentajeSinAsignar.toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salud del Inventario</CardTitle>
            <Shield className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.ratioSalud.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.ratioProblemas.toFixed(1)}% con problemas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura</CardTitle>
            <Target className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.indiceCobertura.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.espaciosConInventario}/{espacios.length} espacios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas temporales y de crecimiento */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creados Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemsCreadosEsteMes}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {stats.diferenciaMesAnterior !== 0 && (
                <>
                  {stats.diferenciaMesAnterior > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={stats.diferenciaMesAnterior > 0 ? 'text-green-600' : 'text-red-600'}>
                    {stats.diferenciaMesAnterior > 0 ? '+' : ''}{stats.diferenciaMesAnterior}
                  </span>
                  <span className="text-muted-foreground">
                    ({stats.porcentajeCambioMesAnterior > 0 ? '+' : ''}{stats.porcentajeCambioMesAnterior.toFixed(1)}%)
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creados Este Año</CardTitle>
            <Activity className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemsCreadosEsteAnio}</div>
            <p className="text-xs text-muted-foreground">
              {stats.itemsCreadosUltimos6Meses} últimos 6 meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actualizados Este Mes</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemsActualizadosEsteMes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.itemsActualizadosUltimos7Dias} últimos 7 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Antigüedad Promedio</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.promedioAntiguedadDias)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(stats.promedioTiempoSinActualizarDias)} días sin actualizar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de salud y problemas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Items Críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Críticos Totales</div>
                <div className="text-2xl font-bold text-red-600">{stats.itemsCriticos}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Sin Asignar + Problemas</div>
                <div className="text-2xl font-bold text-orange-600">{stats.itemsSinAsignarConProblemas}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Espacios Sin Inventario</div>
                <div className="text-2xl font-bold">{stats.espaciosSinInventario}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Tipos Sin Items</div>
                <div className="text-2xl font-bold">{stats.tiposSinItems}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Ratios y Eficiencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Ratio de Salud</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${stats.ratioSalud > 70 ? 'bg-green-500' : stats.ratioSalud > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${stats.ratioSalud}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{stats.ratioSalud.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Eficiencia de Asignación</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${stats.eficienciaAsignacion}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{stats.eficienciaAsignacion.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Concentración</span>
                <Badge variant="outline">{stats.concentracionInventario.toFixed(1)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Densidad</span>
                <Badge variant="outline">{stats.densidadInventario.toFixed(1)} items/espacio</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de edad y distribución */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análisis de Edad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-sm">Recientes (30 días)</span>
              </div>
              <span className="font-semibold">{stats.itemsRecientes}</span>
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Jóvenes (3 meses)</span>
              </div>
              <span className="font-semibold">{stats.itemsJovenes}</span>
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Viejos (1+ año)</span>
              </div>
              <span className="font-semibold">{stats.itemsViejos}</span>
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Sin actualizar (6+ meses)</span>
              </div>
              <span className="font-semibold">{stats.itemsSinActualizarMasDe6Meses}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Cantidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <span className="text-sm">Cantidad 1</span>
              <Badge variant="outline">{stats.itemsConCantidad1}</Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <span className="text-sm">Cantidad Media (2-10)</span>
              <Badge variant="outline">{stats.itemsConCantidadMedia}</Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <span className="text-sm">Cantidad Alta (&gt;10)</span>
              <Badge variant="outline">{stats.itemsConCantidadAlta}</Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <span className="text-sm">Rango</span>
              <Badge variant="outline">{stats.cantidadMinima} - {stats.cantidadMaxima}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Con Observaciones</span>
              </div>
              <span className="font-semibold">{stats.itemsConObservaciones}</span>
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Sin Observaciones</span>
              </div>
              <span className="font-semibold">{stats.itemsSinObservaciones}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${stats.porcentajeConObservaciones}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {stats.porcentajeConObservaciones.toFixed(1)}% con observaciones
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promedios y métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Promedios Generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Items por espacio</span>
              </div>
              <span className="text-lg font-semibold">{stats.promedioItemsPorEspacio.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Cantidad por item</span>
              </div>
              <span className="text-lg font-semibold">{stats.promedioCantidadPorItem.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Items por tipo</span>
              </div>
              <span className="text-lg font-semibold">{stats.promedioItemsPorTipo.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Cantidad por espacio</span>
              </div>
              <span className="text-lg font-semibold">{stats.promedioCantidadPorEspacio.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Cantidad por tipo</span>
              </div>
              <span className="text-lg font-semibold">{stats.promedioCantidadPorTipo.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  <span>Disponibles</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{stats.disponibles}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.porcentajeDisponibles.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.porcentajeDisponibles}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 text-yellow-600" />
                  <span>Mantenimiento</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{stats.mantenimiento}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.porcentajeMantenimiento.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.porcentajeMantenimiento}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                  <span>Dañados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{stats.danados}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.porcentajeDanados.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.porcentajeDanados}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución de Estados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <span className="text-sm">Espacios solo disponibles</span>
                <Badge variant="outline">{stats.espaciosConSoloDisponibles}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <span className="text-sm">Espacios solo mantenimiento</span>
                <Badge variant="outline">{stats.espaciosConSoloMantenimiento}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <span className="text-sm">Espacios solo dañados</span>
                <Badge variant="outline">{stats.espaciosConSoloDanados}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <span className="text-sm">Espacios con mezcla</span>
                <Badge variant="outline">{stats.espaciosConMezclaEstados}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top espacios y tipos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Espacios con Más Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topEspacios.length > 0 ? (
                stats.topEspacios.map((espacio, index) => (
                  <div key={espacio.espacioId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{espacio.espacioNombre}</p>
                        <p className="text-sm text-muted-foreground">{espacio.items} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{espacio.cantidad}</p>
                      <p className="text-xs text-muted-foreground">unidades</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay espacios con inventario asignado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Tipos de Elemento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topTipos.length > 0 ? (
                stats.topTipos.map((tipo, index) => (
                  <div key={tipo.tipoId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{tipo.tipoNombre}</p>
                        <p className="text-sm text-muted-foreground">{tipo.items} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{tipo.cantidad}</p>
                      <p className="text-xs text-muted-foreground">unidades</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay tipos de elemento disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Espacios y tipos con problemas */}
      {stats.espaciosConMasProblemas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Espacios con Más Problemas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.espaciosConMasProblemas.map((espacio, index) => (
                <div key={espacio.espacioId} className="p-3 border rounded-lg border-red-200 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{espacio.espacioNombre}</span>
                    <Badge variant="destructive" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Problemas</span>
                    <span className="font-bold text-red-600">{espacio.problemas}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ width: `${espacio.porcentaje}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {espacio.porcentaje.toFixed(1)}% del inventario
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.tiposConMasProblemas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Tipos con Más Problemas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.tiposConMasProblemas.map((tipo, index) => (
                <div key={tipo.tipoId} className="p-3 border rounded-lg border-red-200 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{tipo.tipoNombre}</span>
                    <Badge variant="destructive" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Problemas</span>
                    <span className="font-bold text-red-600">{tipo.problemas}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ width: `${tipo.porcentaje}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {tipo.porcentaje.toFixed(1)}% del inventario
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla completa de tipos */}
      {stats.itemsPorTipo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventario Completo por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Tipo de Elemento</th>
                    <th className="text-right p-2 font-medium">Items</th>
                    <th className="text-right p-2 font-medium">Cantidad Total</th>
                    <th className="text-right p-2 font-medium">Disponibles</th>
                    <th className="text-right p-2 font-medium">Mantenimiento</th>
                    <th className="text-right p-2 font-medium">Dañados</th>
                    <th className="text-right p-2 font-medium">% del Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.itemsPorTipo.map((tipo) => {
                    const porcentaje = stats.totalItems > 0 ? (tipo.items / stats.totalItems) * 100 : 0;
                    return (
                      <tr key={tipo.tipoId} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{tipo.tipoNombre}</td>
                        <td className="p-2 text-right">{tipo.items}</td>
                        <td className="p-2 text-right">{tipo.cantidad}</td>
                        <td className="p-2 text-right">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {tipo.disponibles}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {tipo.mantenimiento}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {tipo.danados}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">
                          <Badge variant="outline">{porcentaje.toFixed(1)}%</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
