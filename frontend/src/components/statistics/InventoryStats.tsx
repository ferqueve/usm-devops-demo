import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PopoverFilterSection,
  EnumFilterSection,
  ClearFiltersButton,
} from "@/components/ui/compact-filter";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { espaciosApi } from '@/lib/api/spaces';
import { inventarioApi } from '@/lib/api/inventory';
import type { TipoElemento, Espacio, InventoryStats as InventoryStatsData } from '@/lib/types/spaces';
import PermissionGuard from '@/components/auth/PermissionGuard';
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
  Tag,
  XCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportInventoryStatsToPDF } from '@/lib/utils/pdf-export';
import InventoryCharts from './InventoryCharts';
import { StatCard } from './StatCard';
import { StatStrip } from '@/components/dashboard/views/_components/StatStrip';
import EstadisticasAvanzadasInventario from './EstadisticasAvanzadasInventario';

// Tipos: la forma completa de InventoryStats vive en `@/lib/types/spaces`.
// Acá la importamos como `InventoryStatsData` para no chocar con el nombre del componente.

export default function InventoryStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStatsData | null>(null);
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
          inventarioApi.listarTiposElemento(),
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
        const response = await inventarioApi.obtenerEstadisticasDetalladasInventario(
          filterEspacio,
          filterTipoElemento,
          filterEstado
        );
        
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
        estado: filterEstado === 'todos' ? undefined : filterEstado,
      });

      toast.success('PDF generado exitosamente', {
        description: 'El reporte se ha descargado correctamente'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo generar el archivo PDF';
      console.error('Error al exportar:', error);
      toast.error('Error al generar PDF', {
        description: errorMessage
      });
    }
  };

  const handleRefresh = async () => {
    try {
      const response = await inventarioApi.obtenerEstadisticasDetalladasInventario(
        filterEspacio,
        filterTipoElemento,
        filterEstado
      );
      
      if (response.data) {
        setStats(response.data);
        toast.success('Datos actualizados');
      }
    } catch {
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
            onClick={handleRefresh}
            aria-label="Actualizar"
            className="h-9 w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Actualizar</TooltipContent>
      </Tooltip>
      <PermissionGuard requiredPermission="estadisticas:ver_inventario">
        <Button onClick={handleExport} className="h-9">
          <FileDown className="h-4 w-4 mr-1.5" />
          Exportar
        </Button>
      </PermissionGuard>
    </>
  );

  return (
    <div className="space-y-6">
      {actionsSlot
        ? createPortal(actions, actionsSlot)
        : <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}

      {/* Filtros compactos al estilo del resto de la app */}
      <div className="flex items-center gap-2 flex-wrap">
        <PopoverFilterSection<number>
          selectedId={filterEspacio ?? null}
          items={espacios.map(e => ({ id: e.id, primary: e.nombre }))}
          onChange={(value) => setFilterEspacio(value ?? null)}
          Icon={Building2}
          tooltipNone="Todos los espacios"
        />
        <PopoverFilterSection<number>
          selectedId={filterTipoElemento ?? null}
          items={tiposElemento.map(t => ({ id: t.id, primary: t.nombre }))}
          onChange={(value) => setFilterTipoElemento(value ?? null)}
          Icon={Tag}
          tooltipNone="Todos los tipos"
          activeBgClass="bg-purple-100 text-purple-900 shadow-md ring-1 ring-purple-300"
          activeTextColorClass="text-purple-700"
        />
        <EnumFilterSection
          value={filterEstado === 'todos' ? null : filterEstado}
          options={[
            { value: null, tooltip: 'Todos los estados', Icon: Filter },
            {
              value: 'DISPONIBLE',
              tooltip: 'Disponible',
              Icon: CheckCircle2,
              activeColorClass: 'text-green-600',
              inactiveColorClass: 'text-green-500',
            },
            {
              value: 'MANTENIMIENTO',
              tooltip: 'En mantenimiento',
              Icon: Wrench,
              activeColorClass: 'text-amber-600',
              inactiveColorClass: 'text-amber-500',
            },
            {
              value: 'DANADO',
              tooltip: 'Dañado',
              Icon: XCircle,
              activeColorClass: 'text-red-600',
              inactiveColorClass: 'text-red-500',
            },
          ]}
          onChange={(value) => setFilterEstado(value ?? 'todos')}
        />
        <ClearFiltersButton
          visible={hayFiltrosActivos}
          onClear={handleClearFilters}
        />
      </div>

      {/* Strip principal con colores institucionales UTEC */}
      <StatStrip
        items={[
          { label: 'Total items', value: stats.totalItems, hint: `${stats.totalCantidad} unidades`, icon: Package, bg: 'dark' },
          { label: 'Disponibles', value: stats.disponibles, hint: `${stats.porcentajeDisponibles.toFixed(1)}% del total`, icon: CheckCircle2, bg: 'green' },
          { label: 'En mantenimiento', value: stats.mantenimiento, hint: `${stats.porcentajeMantenimiento.toFixed(1)}% del total`, icon: Wrench, bg: 'yellow' },
          { label: 'Dañados', value: stats.danados, hint: `${stats.porcentajeDanados.toFixed(1)}% del total`, icon: AlertCircle, bg: 'red' },
          { label: 'Salud', value: `${stats.ratioSalud.toFixed(0)}%`, hint: `${stats.ratioProblemas.toFixed(0)}% con problemas`, icon: Shield, bg: 'cyan' },
          { label: 'Cobertura', value: `${stats.indiceCobertura.toFixed(0)}%`, hint: `${stats.espaciosConInventario}/${espacios.length} espacios`, icon: Target, bg: 'blue' },
        ]}
      />

      {/* Strip secundario compacto con asignación + temporales */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 text-sm">
        {[
          { label: 'Asignados', value: stats.asignados, icon: MapPin },
          { label: 'Sin asignar', value: stats.sinAsignar, icon: Boxes },
          { label: 'Creados este mes', value: stats.itemsCreadosEsteMes, icon: Calendar, accent: stats.diferenciaMesAnterior > 0 ? 'text-utec-yellow' : stats.diferenciaMesAnterior < 0 ? 'text-utec-red' : undefined },
          { label: 'Creados este año', value: stats.itemsCreadosEsteAnio, icon: Activity },
          { label: 'Actualizados este mes', value: stats.itemsActualizadosEsteMes, icon: RefreshCw },
          { label: 'Antigüedad prom.', value: `${Math.round(stats.promedioAntiguedadDias)}d`, icon: Clock },
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

      {/* Bloque 1: Salud operativa + Caracterización del parque */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Items críticos */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
            <span className="w-1 h-4 rounded-sm bg-utec-red shrink-0" />
            <ShieldAlert className="h-3.5 w-3.5 text-white/70 shrink-0" />
            <h3 className="text-sm font-semibold tracking-tight">Items críticos</h3>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Críticos totales', value: stats.itemsCriticos, accent: 'text-utec-red' },
              { label: 'Sin asignar + problemas', value: stats.itemsSinAsignarConProblemas, accent: 'text-utec-orange' },
              { label: 'Espacios sin inventario', value: stats.espaciosSinInventario },
              { label: 'Tipos sin items', value: stats.tiposSinItems },
            ].map((it) => (
              <div key={it.label} className="rounded-lg border bg-muted/30 px-3 py-2">
                <div className="text-[11px] text-muted-foreground mb-0.5 truncate">{it.label}</div>
                <div className={`text-xl font-semibold tabular-nums ${it.accent ?? ''}`}>{it.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicadores de salud */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
            <span className="w-1 h-4 rounded-sm bg-utec-green shrink-0" />
            <Shield className="h-3.5 w-3.5 text-white/70 shrink-0" />
            <h3 className="text-sm font-semibold tracking-tight">Indicadores de salud</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              {
                label: 'Ratio de salud',
                hint: '% items disponibles',
                value: stats.ratioSalud,
                color: stats.ratioSalud > 70 ? 'bg-utec-green' : stats.ratioSalud > 40 ? 'bg-utec-yellow' : 'bg-utec-red',
              },
              {
                label: 'Eficiencia de asignación',
                hint: '% items con espacio asignado',
                value: stats.eficienciaAsignacion,
                color: 'bg-utec-blue',
              },
              {
                label: '% items con observaciones',
                hint: 'mantenimiento documentado',
                value: stats.porcentajeConObservaciones,
                color: 'bg-utec-cyan',
              },
            ].map((b) => (
              <div key={b.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium">{b.label}</div>
                    <div className="text-[10px] text-muted-foreground">{b.hint}</div>
                  </div>
                  <span className="font-semibold tabular-nums">{b.value.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded">
                  <div className={`h-2 rounded ${b.color}`} style={{ width: `${Math.min(100, b.value)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bloque 2: Análisis de edad + Promedios clave */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
            <span className="w-1 h-4 rounded-sm bg-utec-cyan shrink-0" />
            <Clock className="h-3.5 w-3.5 text-white/70 shrink-0" />
            <h3 className="text-sm font-semibold tracking-tight">Análisis de edad del parque</h3>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Recientes (30 días)', value: stats.itemsRecientes, icon: Zap, accent: 'text-utec-green' },
              { label: 'Jóvenes (3 meses)', value: stats.itemsJovenes, icon: Activity, accent: 'text-utec-blue' },
              { label: 'Viejos (1+ año)', value: stats.itemsViejos, icon: Clock, accent: 'text-utec-orange' },
              { label: 'Sin actualizar (6+ meses)', value: stats.itemsSinActualizarMasDe6Meses, icon: AlertTriangle, accent: 'text-utec-red' },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className="rounded-lg border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${accent}`} />
                  <span className="truncate">{label}</span>
                </div>
                <div className="text-xl font-semibold tabular-nums">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
            <span className="w-1 h-4 rounded-sm bg-utec-blue shrink-0" />
            <BarChart3 className="h-3.5 w-3.5 text-white/70 shrink-0" />
            <h3 className="text-sm font-semibold tracking-tight">Promedios del parque</h3>
          </div>
          <div className="p-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Items por espacio', value: stats.promedioItemsPorEspacio.toFixed(1), icon: Building2 },
              { label: 'Items por tipo', value: stats.promedioItemsPorTipo.toFixed(1), icon: Layers },
              { label: 'Unidades por item', value: stats.promedioCantidadPorItem.toFixed(1), icon: Package },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </div>
                <div className="text-xl font-semibold tabular-nums">{value}</div>
              </div>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t bg-muted/40 text-[10px] text-muted-foreground">
            Cantidad mín/máx por item: <span className="font-semibold tabular-nums">{stats.cantidadMinima}–{stats.cantidadMaxima}</span>
          </div>
        </div>
      </div>

      {/* Top espacios + Top tipos con look de Reservas */}
      <div className="grid gap-4 lg:grid-cols-2">
        {stats.topEspacios.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
              <span className="w-1 h-4 rounded-sm bg-utec-yellow shrink-0" />
              <Building2 className="h-3.5 w-3.5 text-white/70 shrink-0" />
              <h3 className="text-sm font-semibold tracking-tight">Top 10 espacios con más inventario</h3>
            </div>
            <div className="divide-y divide-border/60">
              {stats.topEspacios.map((espacio, index) => (
                <div key={espacio.espacioId} className="flex items-center justify-between px-4 py-1.5 text-sm hover:bg-muted/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5 text-right tabular-nums">{index + 1}.</span>
                    <span className="truncate">{espacio.espacioNombre}</span>
                  </div>
                  <span className="tabular-nums text-xs text-muted-foreground shrink-0">
                    <span className="font-semibold text-utec-dark">{espacio.items}</span> items · <span className="font-semibold text-utec-blue">{espacio.cantidad}</span> ud.
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.topTipos.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
              <span className="w-1 h-4 rounded-sm bg-utec-cyan shrink-0" />
              <Tag className="h-3.5 w-3.5 text-white/70 shrink-0" />
              <h3 className="text-sm font-semibold tracking-tight">Top 10 tipos de elemento</h3>
            </div>
            <div className="divide-y divide-border/60">
              {stats.topTipos.map((tipo, index) => (
                <div key={tipo.tipoId} className="flex items-center justify-between px-4 py-1.5 text-sm hover:bg-muted/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5 text-right tabular-nums">{index + 1}.</span>
                    <span className="truncate">{tipo.tipoNombre}</span>
                  </div>
                  <span className="tabular-nums text-xs text-muted-foreground shrink-0">
                    <span className="font-semibold text-utec-dark">{tipo.items}</span> items · <span className="font-semibold text-utec-cyan">{tipo.cantidad}</span> ud.
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Espacios + tipos con más problemas: tablas compactas en 2 cols */}
      {(stats.espaciosConMasProblemas.length > 0 || stats.tiposConMasProblemas.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {stats.espaciosConMasProblemas.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
                <span className="w-1 h-4 rounded-sm bg-utec-red shrink-0" />
                <AlertTriangle className="h-3.5 w-3.5 text-white/70 shrink-0" />
                <h3 className="text-sm font-semibold tracking-tight">Espacios con más problemas</h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b">
                    <th className="text-left py-1.5 px-3 font-medium">Espacio</th>
                    <th className="text-right py-1.5 px-3 font-medium w-20">Problemas</th>
                    <th className="text-right py-1.5 px-3 font-medium w-20">% inv.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stats.espaciosConMasProblemas.map((espacio) => (
                    <tr key={espacio.espacioId} className="hover:bg-muted/30">
                      <td className="py-1.5 px-3 truncate">{espacio.espacioNombre}</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-utec-red tabular-nums">{espacio.problemas}</td>
                      <td className="py-1.5 px-3 text-right">
                        <span className="inline-block min-w-[3rem] text-center px-2 py-0.5 rounded font-semibold tabular-nums text-[11px] bg-utec-red/15 text-utec-red">
                          {espacio.porcentaje.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {stats.tiposConMasProblemas.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
                <span className="w-1 h-4 rounded-sm bg-utec-red shrink-0" />
                <AlertTriangle className="h-3.5 w-3.5 text-white/70 shrink-0" />
                <h3 className="text-sm font-semibold tracking-tight">Tipos con más problemas</h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b">
                    <th className="text-left py-1.5 px-3 font-medium">Tipo</th>
                    <th className="text-right py-1.5 px-3 font-medium w-20">Problemas</th>
                    <th className="text-right py-1.5 px-3 font-medium w-20">% inv.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stats.tiposConMasProblemas.map((tipo) => (
                    <tr key={tipo.tipoId} className="hover:bg-muted/30">
                      <td className="py-1.5 px-3 truncate">{tipo.tipoNombre}</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-utec-red tabular-nums">{tipo.problemas}</td>
                      <td className="py-1.5 px-3 text-right">
                        <span className="inline-block min-w-[3rem] text-center px-2 py-0.5 rounded font-semibold tabular-nums text-[11px] bg-utec-red/15 text-utec-red">
                          {tipo.porcentaje.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tabla completa por tipo */}
      {stats.itemsPorTipo.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
            <span className="w-1 h-4 rounded-sm bg-utec-blue shrink-0" />
            <FileText className="h-3.5 w-3.5 text-white/70 shrink-0" />
            <h3 className="text-sm font-semibold tracking-tight">Detalle completo por tipo de elemento</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b">
                  <th className="text-left py-1.5 px-3 font-medium">Tipo</th>
                  <th className="text-right py-1.5 px-3 font-medium w-16">Items</th>
                  <th className="text-right py-1.5 px-3 font-medium w-20">Unidades</th>
                  <th className="text-right py-1.5 px-3 font-medium w-20">Dispon.</th>
                  <th className="text-right py-1.5 px-3 font-medium w-20">Manten.</th>
                  <th className="text-right py-1.5 px-3 font-medium w-16">Dañad.</th>
                  <th className="text-right py-1.5 px-3 font-medium w-16">% tot.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.itemsPorTipo.map((tipo) => {
                  const porcentaje = stats.totalItems > 0 ? (tipo.items / stats.totalItems) * 100 : 0;
                  return (
                    <tr key={tipo.tipoId} className="hover:bg-muted/30">
                      <td className="py-1.5 px-3 font-medium truncate">{tipo.tipoNombre}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{tipo.items}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-muted-foreground">{tipo.cantidad}</td>
                      <td className="py-1.5 px-3 text-right">
                        <span className="inline-block min-w-[1.75rem] text-center font-semibold tabular-nums text-utec-green">{tipo.disponibles}</span>
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <span className={`inline-block min-w-[1.75rem] text-center font-semibold tabular-nums ${tipo.mantenimiento > 0 ? 'text-utec-yellow' : 'text-muted-foreground/50'}`}>{tipo.mantenimiento}</span>
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <span className={`inline-block min-w-[1.75rem] text-center font-semibold tabular-nums ${tipo.danados > 0 ? 'text-utec-red' : 'text-muted-foreground/50'}`}>{tipo.danados}</span>
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-muted-foreground">{porcentaje.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Métricas analíticas (capa OLAP) */}
      <EstadisticasAvanzadasInventario />
    </div>
  );
}
