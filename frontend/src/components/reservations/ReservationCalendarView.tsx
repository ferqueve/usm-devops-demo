import { useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Clock, MapPin, ChevronLeft, ChevronRight, Moon, CheckCircle2, XCircle, Hourglass, Loader2 } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import { getEstadoConfig, formatTime } from './reservationUtils';
import ReservationFilters from './ReservationFilters';
import { FullScreenToggle, ViewModeToggle } from './_shared/ReservationListChrome';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, isToday, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { usePreferences } from '@/hooks/usePreferences';

interface Espacio {
  id: number;
  nombre: string;
}

type CalendarViewMode = 'day' | 'week' | 'month';

interface Carrera {
  id: number;
  nombre: string;
  codigo?: string;
}

interface TipoEspacio {
  id: number;
  nombre: string;
  color?: string;
}

function getIntervalBorderClass(esHoraCompleta: boolean, esMediaHora: boolean): string {
  if (esHoraCompleta) return 'border-t border-gray-400';
  if (esMediaHora) return 'border-t border-gray-300';
  return 'border-t border-gray-200';
}

interface PosicionVertical {
  topPercent: number;
  alturaPercent: number;
  minutosInicio: number;
  minutosFin: number;
}

interface RangoVisibleConfig {
  minutosInicioVisible: number;
  minutosFinVisible: number;
  minutosTotalesVisibles: number;
}

// Calcula posición vertical de una reserva en un timeline visible
function calcularPosicionVerticalReserva(reserva: Reserva, cfg: RangoVisibleConfig): PosicionVertical | null {
  const inicio = new Date(reserva.inicio);
  const fin = new Date(reserva.fin);
  const minutosInicio = inicio.getHours() * 60 + inicio.getMinutes();
  const minutosFin = fin.getHours() * 60 + fin.getMinutes();
  const minutosFinAjustados = minutosFin === 0 ? 24 * 60 : minutosFin;

  if (minutosFinAjustados <= cfg.minutosInicioVisible || minutosInicio >= cfg.minutosFinVisible) {
    return null;
  }

  const minutosInicioAjustados = Math.max(minutosInicio, cfg.minutosInicioVisible);
  const minutosFinAjustadosVisibles = Math.min(minutosFinAjustados, cfg.minutosFinVisible);
  const minutosDesdeInicioVisible = minutosInicioAjustados - cfg.minutosInicioVisible;
  const topPercent = (minutosDesdeInicioVisible / cfg.minutosTotalesVisibles) * 100;
  const alturaPercent =
    ((minutosFinAjustadosVisibles - minutosInicioAjustados) / cfg.minutosTotalesVisibles) * 100;
  return {
    topPercent,
    alturaPercent,
    minutosInicio: minutosInicioAjustados,
    minutosFin: minutosFinAjustadosVisibles,
  };
}

interface RangoMinutos { minutosInicio: number; minutosFin: number }

// Verifica si dos rangos de minutos se superponen
function haySuperposicion(a: RangoMinutos, b: RangoMinutos): boolean {
  return (
    (a.minutosInicio >= b.minutosInicio && a.minutosInicio < b.minutosFin) ||
    (a.minutosFin > b.minutosInicio && a.minutosFin <= b.minutosFin) ||
    (a.minutosInicio <= b.minutosInicio && a.minutosFin >= b.minutosFin) ||
    (b.minutosInicio <= a.minutosInicio && b.minutosFin >= a.minutosFin)
  );
}

// Encuentra los índices de los grupos que se superponen con la reserva dada
function encontrarGruposSuperpuestos<T extends RangoMinutos>(
  grupos: T[][],
  reserva: T
): number[] {
  const resultado: number[] = [];
  for (let i = 0; i < grupos.length; i++) {
    if (grupos[i].some(g => haySuperposicion(reserva, g))) {
      resultado.push(i);
    }
  }
  return resultado;
}

// Inserta una reserva en el conjunto de grupos, fusionando si hay superposiciones
function insertarReservaEnGrupos<T extends RangoMinutos>(grupos: T[][], reserva: T): void {
  const superpuestos = encontrarGruposSuperpuestos(grupos, reserva);
  if (superpuestos.length === 0) {
    grupos.push([reserva]);
    return;
  }
  const grupoFusionado = superpuestos.flatMap(idx => grupos[idx]);
  grupoFusionado.push(reserva);
  superpuestos.slice().reverse().forEach(idx => grupos.splice(idx, 1));
  grupos.push(grupoFusionado);
}

interface GrupoReservasPorRango {
  reservas: Reserva[];
  inicio: Date;
  fin: Date;
  minutosInicio: number;
  minutosFin: number;
  estado: string;
}

// Agrupa reservas con el mismo rango horario y mismo estado
function agruparReservasPorRangoYEstado(reservas: Reserva[]): GrupoReservasPorRango[] {
  const grupos: GrupoReservasPorRango[] = [];
  reservas.forEach(reserva => {
    const inicioReserva = new Date(reserva.inicio);
    const finReserva = new Date(reserva.fin);
    const minutosInicio = inicioReserva.getHours() * 60 + inicioReserva.getMinutes();
    const minutosFin = finReserva.getHours() * 60 + finReserva.getMinutes();
    const grupoExistente = grupos.find(g =>
      g.minutosInicio === minutosInicio &&
      g.minutosFin === minutosFin &&
      g.estado === reserva.estado
    );
    if (grupoExistente) {
      grupoExistente.reservas.push(reserva);
    } else {
      grupos.push({
        reservas: [reserva],
        inicio: inicioReserva,
        fin: finReserva,
        minutosInicio,
        minutosFin,
        estado: reserva.estado,
      });
    }
  });
  return grupos;
}

// Encuentra la primera columna sin solapamiento; retorna -1 si todas solapan
function encontrarColumnaDisponible(
  columnas: GrupoReservasPorRango[][],
  grupo: GrupoReservasPorRango
): number {
  for (let i = 0; i < columnas.length; i++) {
    const haySolapamiento = columnas[i].some(g =>
      grupo.minutosInicio < g.minutosFin && grupo.minutosFin > g.minutosInicio
    );
    if (!haySolapamiento) return i;
  }
  return -1;
}

// Distribuye los grupos en columnas según solapamientos
function distribuirGruposEnColumnas(grupos: GrupoReservasPorRango[]): GrupoReservasPorRango[][] {
  const columnas: GrupoReservasPorRango[][] = [];
  grupos.forEach(grupo => {
    const columnaEncontrada = encontrarColumnaDisponible(columnas, grupo);
    if (columnaEncontrada === -1) {
      columnas.push([grupo]);
    } else {
      columnas[columnaEncontrada].push(grupo);
    }
  });
  return columnas;
}

// Encuentra el índice de la columna donde está un grupo
function indiceColumnaDeGrupo(
  columnas: GrupoReservasPorRango[][],
  grupo: GrupoReservasPorRango
): number {
  for (let i = 0; i < columnas.length; i++) {
    const presente = columnas[i].some(g =>
      g.minutosInicio === grupo.minutosInicio &&
      g.minutosFin === grupo.minutosFin &&
      g.estado === grupo.estado
    );
    if (presente) return i;
  }
  return 0;
}

interface GrupoReservasConPosicion extends GrupoReservasPorRango {
  columna: number;
  totalColumnas: number;
}

// Calcula la distribución horizontal de grupos de reservas para un día
function calcularPosicionesReservasPorDia(reservasDia: Reserva[]): GrupoReservasConPosicion[] {
  if (reservasDia.length === 0) return [];
  const reservasOrdenadas = [...reservasDia].sort((a, b) =>
    new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  );
  const grupos = agruparReservasPorRangoYEstado(reservasOrdenadas);
  const columnas = distribuirGruposEnColumnas(grupos);
  const totalColumnas = columnas.length;
  return grupos.map(grupo => ({
    ...grupo,
    columna: indiceColumnaDeGrupo(columnas, grupo),
    totalColumnas,
  }));
}

interface ColorConfig { bg: string; border: string; hoverBg: string; hoverBorder: string }

const PALETAS_RESERVA: Record<string, ColorConfig[]> = {
  CANCELADO: [
    { bg: 'bg-red-600', border: 'border-red-700', hoverBg: 'hover:bg-red-700', hoverBorder: 'hover:border-red-800' },
    { bg: 'bg-red-500', border: 'border-red-600', hoverBg: 'hover:bg-red-600', hoverBorder: 'hover:border-red-700' },
    { bg: 'bg-red-400', border: 'border-red-500', hoverBg: 'hover:bg-red-500', hoverBorder: 'hover:border-red-600' },
    { bg: 'bg-red-300', border: 'border-red-400', hoverBg: 'hover:bg-red-400', hoverBorder: 'hover:border-red-500' },
  ],
  PENDIENTE: [
    { bg: 'bg-amber-500', border: 'border-amber-600', hoverBg: 'hover:bg-amber-600', hoverBorder: 'hover:border-amber-700' },
    { bg: 'bg-amber-400', border: 'border-amber-500', hoverBg: 'hover:bg-amber-500', hoverBorder: 'hover:border-amber-600' },
    { bg: 'bg-orange-400', border: 'border-orange-500', hoverBg: 'hover:bg-orange-500', hoverBorder: 'hover:border-orange-600' },
    { bg: 'bg-orange-300', border: 'border-orange-400', hoverBg: 'hover:bg-orange-400', hoverBorder: 'hover:border-orange-500' },
  ],
  APROBADO: [
    { bg: 'bg-blue-600', border: 'border-blue-700', hoverBg: 'hover:bg-blue-700', hoverBorder: 'hover:border-blue-800' },
    { bg: 'bg-blue-500', border: 'border-blue-600', hoverBg: 'hover:bg-blue-600', hoverBorder: 'hover:border-blue-700' },
    { bg: 'bg-blue-400', border: 'border-blue-500', hoverBg: 'hover:bg-blue-500', hoverBorder: 'hover:border-blue-600' },
    { bg: 'bg-blue-300', border: 'border-blue-400', hoverBg: 'hover:bg-blue-400', hoverBorder: 'hover:border-blue-500' },
  ],
};

function getColorConfigByEstado(estado: string, columnaIndex: number): ColorConfig {
  const paleta = PALETAS_RESERVA[estado.toUpperCase()] ?? PALETAS_RESERVA.APROBADO;
  return paleta[columnaIndex % paleta.length];
}

// Resultado del cálculo: posición y dimensiones de una reserva en la grilla
interface ReservaConPosicionCompleta {
  reserva: Reserva;
  topPercent: number;
  alturaPercent: number;
  minutosInicio: number;
  minutosFin: number;
  leftPercent: number;
  widthPercent: number;
}

// Asigna posición horizontal a una reserva dentro de su grupo de superposición
function calcularPosicionHorizontal<T extends RangoMinutos & { reserva: Reserva }>(
  reservaActual: T,
  grupos: T[][],
): T & { leftPercent: number; widthPercent: number } {
  const grupo = grupos.find(g => g.some(r => r.reserva.id === reservaActual.reserva.id));
  if (!grupo) {
    return { ...reservaActual, leftPercent: 0, widthPercent: 100 };
  }
  const grupoOrdenado = [...grupo].sort((a, b) => a.minutosInicio - b.minutosInicio);
  const indiceEnGrupo = grupoOrdenado.findIndex(r => r.reserva.id === reservaActual.reserva.id);
  const numColumnas = grupoOrdenado.length;
  const widthPercent = 100 / numColumnas;
  const leftPercent = widthPercent * indiceEnGrupo;
  return { ...reservaActual, leftPercent, widthPercent };
}

// Renderiza el resumen de cantidad de reservas en la semana
function renderResumenSemana(days: Date[], getReservasForDate: (d: Date) => Reserva[]): ReactNode {
  const totalReservas = days.reduce((total, day) => total + getReservasForDate(day).length, 0);
  if (totalReservas === 0) return null;
  const sufijo = totalReservas === 1 ? '' : 's';
  return (
    <div className="text-xs text-muted-foreground">
      {totalReservas} reserva{sufijo} programada{sufijo} para esta semana
    </div>
  );
}

// Calcula posiciones (vertical y horizontal) para reservas que pueden superponerse
function calcularPosicionesConSuperposicion(
  reservasOrdenadas: Reserva[],
  rangoCfg: RangoVisibleConfig,
): ReservaConPosicionCompleta[] {
  const reservasConPosicion = reservasOrdenadas.map(reserva => {
    const posicion = calcularPosicionVerticalReserva(reserva, rangoCfg);
    return posicion ? { reserva, ...posicion } : null;
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const grupos: Array<Array<typeof reservasConPosicion[0]>> = [];
  reservasConPosicion.forEach(reservaActual => {
    insertarReservaEnGrupos(grupos, reservaActual);
  });

  return reservasConPosicion.map(reservaActual => calcularPosicionHorizontal(reservaActual, grupos));
}

interface ReservationBarProps {
  top: number;
  left: number;
  anchoFijo: number;
  altura: number;
  colorConfig: { bg: string; border: string; hoverBg: string; hoverBorder: string };
  tituloTooltip: string;
  zIndex: number;
  reserva: Reserva;
  onViewDetails: (reserva: Reserva) => void;
}

function ReservationBar({
  top,
  left,
  anchoFijo,
  altura,
  colorConfig,
  tituloTooltip,
  zIndex,
  reserva,
  onViewDetails,
}: Readonly<ReservationBarProps>) {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const handleClick = useCallback(() => onViewDetails(reserva), [onViewDetails, reserva]);

  return (
    <button
      type="button"
      className="absolute cursor-pointer group p-0 bg-transparent border-0 text-left"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        width: `${anchoFijo}px`,
        height: `${altura}px`,
        zIndex: zIndex,
      }}
      onClick={handleClick}
      aria-label={tituloTooltip}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => {
        setShowTooltip(false);
        setMousePosition(null);
      }}
      onMouseMove={(e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Barra fina con borde - solo color */}
      <div
        className={`h-full border-2 rounded-sm ${colorConfig.bg} ${colorConfig.border} ${colorConfig.hoverBg} ${colorConfig.hoverBorder} transition-colors relative`}
        style={{ minHeight: '2px' }}
      />
      {/* Tooltip que sigue el cursor - renderizado en portal para quedar por encima del resto */}
      {showTooltip && mousePosition && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed pointer-events-none z-[99999] bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y + 10}px`,
          }}
        >
          {tituloTooltip}
        </div>,
        document.body
      )}
    </button>
  );
}

// Lee la vista actual del calendario respetando preferencias del usuario.
function useCalendarViewMode(prefersWeekDefault: boolean) {
  const { preferencias } = usePreferences();
  const preferenciaCalendarViewMode = preferencias?.reservasCalendarViewMode as CalendarViewMode | undefined;
  const defaultMode: CalendarViewMode = prefersWeekDefault ? 'week' : 'month';
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>(
    preferenciaCalendarViewMode ?? defaultMode,
  );
  useEffect(() => {
    if (preferencias?.reservasCalendarViewMode) {
      setCalendarViewMode(preferencias.reservasCalendarViewMode as CalendarViewMode);
    }
  }, [preferencias]);
  return { calendarViewMode, setCalendarViewMode };
}

// Maneja modo pantalla completa local + scroll-lock del documento.
function useFullScreen(isFullScreenProp?: boolean, onToggleFullScreenProp?: () => void) {
  const [isFullScreenInternal, setIsFullScreenInternal] = useState(false);
  const isFullScreen = isFullScreenProp ?? isFullScreenInternal;
  const handleToggleFullScreen = onToggleFullScreenProp ?? (() => setIsFullScreenInternal(prev => !prev));
  useEffect(() => {
    const overflowValue = isFullScreen ? 'hidden' : '';
    document.body.style.overflow = overflowValue;
    document.documentElement.style.overflow = overflowValue;
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isFullScreen]);
  return { isFullScreen, handleToggleFullScreen };
}

interface ReservationCalendarViewProps {
  reservas: Reserva[];
  espaciosUnicos: Espacio[];
  carrerasUnicas?: Carrera[];
  tiposEspacioUnicos?: TipoEspacio[];
  // Filtros
  tiempoFilter: string;
  estadoFilter: string;
  espacioFilter: number | null;
  carreraFilter?: number | null;
  tipoEspacioFilter?: number | null;
  fechaInicio: Date | undefined;
  fechaFin: Date | undefined;
  viewMode: 'cards' | 'table' | 'calendar';
  hayFiltrosActivos: boolean;
  showPendienteFilter?: boolean;
  hideEstadoFilter?: boolean; // Ocultar completamente el filtro de estado
  onTiempoFilterChange: (filter: string) => void;
  onEstadoFilterChange: (filter: string) => void;
  onEspacioFilterChange: (filter: number | null) => void;
  onCarreraFilterChange?: (filter: number | null) => void;
  onTipoEspacioFilterChange?: (filter: number | null) => void;
  onFechaInicioChange: (date: Date | undefined) => void;
  onFechaFinChange: (date: Date | undefined) => void;
  onViewModeChange: (mode: 'cards' | 'table' | 'calendar') => void;
  onClearFilters: () => void;
  // Acciones
  onViewDetails: (reserva: Reserva) => void;
  onCancelReserva: (reserva: Reserva) => void;
  // Pantalla completa
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  // Loading
  loading?: boolean;
  // Modo solo lectura (oculta acciones de gestión)
  readOnly?: boolean;
}

export default function ReservationCalendarView({
  reservas,
  espaciosUnicos,
  carrerasUnicas = [],
  tiposEspacioUnicos = [],
  tiempoFilter,
  estadoFilter,
  espacioFilter,
  carreraFilter,
  tipoEspacioFilter,
  fechaInicio,
  fechaFin,
  viewMode,
  hayFiltrosActivos,
  showPendienteFilter = false,
  hideEstadoFilter = false,
  onTiempoFilterChange,
  onEstadoFilterChange,
  onEspacioFilterChange,
  onCarreraFilterChange,
  onTipoEspacioFilterChange,
  onFechaInicioChange,
  onFechaFinChange,
  onViewModeChange,
  onClearFilters,
  onViewDetails,
  onCancelReserva,
  isFullScreen: isFullScreenProp,
  onToggleFullScreen: onToggleFullScreenProp,
  loading = false,
  readOnly = false,
}: Readonly<ReservationCalendarViewProps>) {
  const { hasPermission } = useRolePermissions();
  const canApprove = hasPermission('reserva:aprobar');
  const canViewRecommendations = hasPermission('recomendacion:ver');

  const { calendarViewMode, setCalendarViewMode } = useCalendarViewMode(canApprove || canViewRecommendations);
  const { isFullScreen, handleToggleFullScreen } = useFullScreen(isFullScreenProp, onToggleFullScreenProp);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [hideNightHours, setHideNightHours] = useState(true);

  // Obtener reservas para una fecha específica
  const getReservasForDate = (date: Date): Reserva[] => {
    return reservas.filter(reserva => {
      const fechaReserva = new Date(reserva.inicio);
      return isSameDay(fechaReserva, date);
    });
  };

  // Obtener reservas para un rango de fechas
  const getReservasForRange = (start: Date, end: Date): Reserva[] => {
    return reservas.filter(reserva => {
      const fechaReserva = new Date(reserva.inicio);
      return fechaReserva >= start && fechaReserva <= end;
    });
  };

  // Navegación: tablas de transición por modo de vista
  const previousByMode: Record<CalendarViewMode, (d: Date) => Date> = {
    day: (d) => subDays(d, 1),
    week: (d) => subWeeks(d, 1),
    month: (d) => subMonths(d, 1),
  };
  const nextByMode: Record<CalendarViewMode, (d: Date) => Date> = {
    day: (d) => addDays(d, 1),
    week: (d) => addWeeks(d, 1),
    month: (d) => addMonths(d, 1),
  };

  const handlePrevious = () => setCurrentDate(previousByMode[calendarViewMode](currentDate));
  const handleNext = () => setCurrentDate(nextByMode[calendarViewMode](currentDate));

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Renderizar vista de día con timeline de intervalos de 15 minutos
  const renderDayView = () => {
    const reservasDia = getReservasForDate(currentDate);
    
    // Ordenar reservas por hora de inicio
    const reservasOrdenadas = [...reservasDia].sort((a, b) => 
      new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
    );

    // Mostrar un rango consistente de horas sin secciones colapsadas
    const horaInicioVisible = hideNightHours ? 8 : 0;
    const horaFinVisible = 24;
    const mostrarColapsadoAntes = false;
    const mostrarColapsadoDespues = false;

    const minutosInicioVisible = horaInicioVisible * 60;
    const minutosFinVisible = horaFinVisible * 60;
    const minutosTotalesVisibles = minutosFinVisible - minutosInicioVisible;
    const alturaPorHora = 120; // 120px por hora
    const alturaAreaVisible = (minutosTotalesVisibles / 60) * alturaPorHora;
    const alturaMinima = alturaAreaVisible + (mostrarColapsadoAntes ? 48 : 0) + (mostrarColapsadoDespues ? 48 : 0);

    const rangoCfg: RangoVisibleConfig = {
      minutosInicioVisible,
      minutosFinVisible,
      minutosTotalesVisibles,
    };

    // Detectar reservas superpuestas y calcular posiciones horizontales
    const posicionesConSuperposicion = calcularPosicionesConSuperposicion(reservasOrdenadas, rangoCfg);

    // Crear intervalos de 15 minutos solo para el rango visible
    const intervalos = Array.from({ length: (minutosTotalesVisibles / 15) }, (_, i) => {
      const minutosTotales = minutosInicioVisible + (i * 15);
      const hora = Math.floor(minutosTotales / 60);
      const minutos = minutosTotales % 60;
      return { hora, minutos, minutosTotales };
    });

           return (
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-white">
             <div className="flex">
               {/* Columna de horas - fija a la izquierda */}
               <div className={`w-28 flex-shrink-0 border-r bg-gray-50/50 relative`} style={{ minHeight: `${alturaMinima}px` }}>
                 {/* Sección colapsada antes */}
                 {mostrarColapsadoAntes && (
                   <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-end pr-3 border-b border-gray-300">
                     <span className="text-xs text-muted-foreground">...</span>
                   </div>
                 )}
                 
                 {/* Intervalos visibles */}
                 {intervalos.map((intervalo) => {
                   const minutosDesdeInicioVisible = intervalo.minutosTotales - minutosInicioVisible;
                   const porcentajeTop = (minutosDesdeInicioVisible / minutosTotalesVisibles) * 100;
                   const esHoraCompleta = intervalo.minutos === 0;
                   const esMediaHora = intervalo.minutos === 30;
                   
                   // Calcular altura del área visible (sin secciones colapsadas)
                   const alturaAreaVisible = alturaMinima - (mostrarColapsadoAntes ? 48 : 0) - (mostrarColapsadoDespues ? 48 : 0);
                   const topPx = (mostrarColapsadoAntes ? 48 : 0) + (porcentajeTop * alturaAreaVisible / 100);
                   const alturaIntervalo = alturaAreaVisible / intervalos.length;
                   
                   const getBorderClass = () => getIntervalBorderClass(esHoraCompleta, esMediaHora);
                   const getTextSizeClass = () => {
                     if (esHoraCompleta) return 'text-base';
                     if (esMediaHora) return 'text-sm';
                     return 'text-xs opacity-75';
                   };
                   return (
                     <div
                       key={`${intervalo.hora}-${intervalo.minutos}`}
                       className={`absolute flex items-center justify-end pr-3 w-full ${getBorderClass()}`}
                       style={{
                         top: `${topPx}px`,
                         height: `${alturaIntervalo}px`
                       }}
                     >
                       <span className={`font-medium text-muted-foreground ${getTextSizeClass()}`}>
                         {intervalo.hora.toString().padStart(2, '0')}:{intervalo.minutos.toString().padStart(2, '0')}
                       </span>
                     </div>
                   );
                 })}
                 
                 {/* Sección colapsada después */}
                 {mostrarColapsadoDespues && (
                   <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-end pr-3 border-t border-gray-300">
                     <span className="text-xs text-muted-foreground">...</span>
                   </div>
                 )}
               </div>

                               {/* Área de timeline - scrollable */}
                <div className={`flex-1 relative bg-white ${isFullScreen ? '' : 'overflow-y-auto'}`} style={{ minHeight: `${alturaMinima}px`, backgroundColor: '#ffffff' }}>
                  {/* Sección colapsada antes */}
                  {mostrarColapsadoAntes && (
                    <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center border-b border-gray-300 bg-gray-50/30">
                      <span className="text-xs text-muted-foreground">...</span>
                    </div>
                  )}
                  
                  {/* Líneas de fondo - coinciden con intervalos de 15 minutos */}
                  <div className="absolute w-full" style={{ 
                    top: mostrarColapsadoAntes ? '48px' : '0',
                    bottom: mostrarColapsadoDespues ? '48px' : '0',
                    left: 0,
                    right: 0
                  }}>
                    {intervalos.map((intervalo) => {
                      const minutosDesdeInicioVisible = intervalo.minutosTotales - minutosInicioVisible;
                      const porcentajeTop = (minutosDesdeInicioVisible / minutosTotalesVisibles) * 100;
                      const esHoraCompleta = intervalo.minutos === 0;
                      const esMediaHora = intervalo.minutos === 30;
                      
                      const getLineBorderClass = () => getIntervalBorderClass(esHoraCompleta, esMediaHora);
                      return (
                        <div
                          key={`line-${intervalo.hora}-${intervalo.minutos}`}
                          className={`absolute w-full ${getLineBorderClass()}`}
                          style={{ top: `${porcentajeTop}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Reservas como barras */}
                  <div className="absolute px-1 py-0.5" style={{ 
                    top: mostrarColapsadoAntes ? '48px' : '0',
                    bottom: mostrarColapsadoDespues ? '48px' : '0',
                    left: 0,
                    right: 0,
                    backgroundColor: 'transparent',
                  }}>
                    {posicionesConSuperposicion.map((item, index) => {
                      const { reserva, topPercent, alturaPercent, leftPercent, widthPercent } = item;
                      const estadoConfig = getEstadoConfig(reserva.estado);
                      const esFutura = new Date(reserva.inicio) > new Date();
                      const esPasada = new Date(reserva.fin) < new Date();
                      const alturaAreaVisible = alturaMinima - (mostrarColapsadoAntes ? 48 : 0) - (mostrarColapsadoDespues ? 48 : 0);
                      const alturaPx = Math.max(alturaPercent * alturaAreaVisible / 100, 48);

                      return (
                        <div
                          key={reserva.id}
                          className={`absolute rounded-md border-l-4 shadow-sm transition-all hover:shadow-md group ${
                            estadoConfig.borderColor
                          }`}
                          style={{
                            top: `${topPercent}%`,
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                            height: `${alturaPx}px`,
                            backgroundColor: 'transparent',
                            opacity: 1,
                            zIndex: 10 + index,
                          }}
                        >
                          <div
                            className={`h-full rounded-md p-1.5 border flex flex-col relative ${
                              esPasada
                                ? 'border-gray-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{
                              backgroundColor: esPasada ? '#f9fafb' : '#ffffff',
                              opacity: esPasada ? 0.85 : 1,
                              isolation: 'isolate',
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            {/* Indicador tipo esquina doblada en la esquina superior derecha - color del tipo de espacio */}
                            {reserva.tipoEspacioColor ? (
                              <div 
                                className="absolute top-0 right-0 w-0 h-0 border-l-transparent border-l-[12px] border-t-[12px] pointer-events-none rounded-tr-md" 
                                style={{ borderTopColor: reserva.tipoEspacioColor }}
                              />
                            ) : (
                              <div className={`absolute top-0 right-0 w-0 h-0 ${estadoConfig.cornerBorderColor} border-l-transparent border-l-[12px] border-t-[12px] pointer-events-none rounded-tr-md`} />
                            )}
                            <h4
                              className={`text-xs font-semibold truncate mb-0.5 ${
                                esPasada ? 'text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {reserva.titulo || reserva.espacioNombre}
                            </h4>
                            <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                <span className="truncate">
                                  {formatTime(reserva.inicio)} - {formatTime(reserva.fin)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-2.5 w-2.5" />
                                <span>Cap. {reserva.capacidadEspacio}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge
                                  className={`${estadoConfig.color} border text-[10px] font-medium px-1 py-0 h-4`}
                                >
                                  {estadoConfig.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mt-auto pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewDetails(reserva);
                                }}
                                className="h-5 px-1.5 text-[10px]"
                              >
                                Ver
                              </Button>
                              {!readOnly && !esPasada && esFutura && reserva.estado === 'APROBADO' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCancelReserva(reserva);
                                  }}
                                  className="h-5 px-1.5 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Indicador de hora actual si es hoy */}
                  {isToday(currentDate) && (() => {
                    const ahora = new Date();
                    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
                    
                    // Si la hora actual está fuera del rango visible, no mostrar
                    if (minutosActuales < minutosInicioVisible || minutosActuales >= minutosFinVisible) {
                      return null;
                    }
                    
                    const minutosDesdeInicioVisible = minutosActuales - minutosInicioVisible;
                    const topPercent = (minutosDesdeInicioVisible / minutosTotalesVisibles) * 100;
                    
                    return (
                      <div
                        className="absolute left-0 right-0 z-10"
                        style={{ 
                          top: `${(mostrarColapsadoAntes ? 48 : 0) + (topPercent * (alturaMinima - (mostrarColapsadoAntes ? 48 : 0) - (mostrarColapsadoDespues ? 48 : 0)) / 100)}px`
                        }}
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 -mt-1"></div>
                          <div className="flex-1 h-0.5 bg-red-500"></div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Sección colapsada después */}
                  {mostrarColapsadoDespues && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center border-t border-gray-300 bg-gray-50/30">
                      <span className="text-xs text-muted-foreground">...</span>
                    </div>
                  )}
                </div>
          </div>
        </div>

        {/* Resumen de reservas del día */}
        {reservasOrdenadas.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {reservasOrdenadas.length} reserva{reservasOrdenadas.length === 1 ? '' : 's'} programada{reservasOrdenadas.length === 1 ? '' : 's'} para este día
          </div>
        )}
      </div>
    );
  };

  // Renderizar vista de semana
  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    // Calcular rango de horas para toda la semana
    let horaMinima = 24;
    let horaMaxima = 0;
    let hayReservas = false;

    days.forEach(day => {
      const reservasDia = getReservasForDate(day);
      reservasDia.forEach(reserva => {
        const inicio = new Date(reserva.inicio);
        const fin = new Date(reserva.fin);
        const horaInicio = inicio.getHours();
        const horaFin = fin.getHours() === 0 && fin.getMinutes() === 0 ? 24 : fin.getHours();
        
        if (horaInicio < horaMinima) horaMinima = horaInicio;
        if (horaFin > horaMaxima) horaMaxima = horaFin;
        hayReservas = true;
      });
    });

    // Rango visible: ajustar según hideNightHours y reservas
    let horaInicioVisible: number;
    let horaFinVisible: number;
    
    if (hideNightHours) {
      // Si hideNightHours está activo, empezar en 8am por defecto
      horaInicioVisible = 8;
      horaFinVisible = 24;
      
      // Si hay reservas antes de las 8am, mostrar desde más temprano
      if (hayReservas && horaMinima < 8) {
        horaInicioVisible = Math.max(0, horaMinima - 1);
      }
      // Si hay reservas después de las 22pm, expandir hasta más tarde
      if (hayReservas && horaMaxima >= 22) {
        horaFinVisible = Math.min(24, horaMaxima + 1);
      }
    } else {
      // Si hideNightHours está desactivado, mostrar desde 0am
      horaInicioVisible = hayReservas && horaMinima > 0 ? Math.max(0, horaMinima - 1) : 0;
      horaFinVisible = hayReservas && horaMaxima >= 22 ? Math.min(24, horaMaxima + 1) : 24;
    }
    
    const horasVisibles = horaFinVisible - horaInicioVisible;
    const alturaPorHora = isFullScreen ? 60 : 50;
    const alturaTotal = horasVisibles * alturaPorHora;

    // Generar todas las horas del día en el rango visible
    const horas = Array.from({ length: horasVisibles }, (_, i) => horaInicioVisible + i);

    return (
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="grid grid-cols-8 border-b bg-gray-50">
            {/* Celda vacía para el header de horas */}
            <div className="p-2 border-r"></div>
            {/* Headers de días */}
            {days.map((day) => {
              const esHoy = isToday(day);
              return (
                <div
                  key={`header-${day.toISOString()}`}
                  className={`p-2 text-center border-r last:border-r-0 ${esHoy ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-xs font-semibold ${esHoy ? 'text-blue-700' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={`text-xs ${esHoy ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
                    {format(day, 'd', { locale: es })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contenido - sin scroll, se extiende */}
          <div className="overflow-visible">
            <div className="grid grid-cols-8">
              {/* Columna de horas */}
              <div className="border-r bg-gray-50/50">
                {horas.map((hora) => (
                  <div
                    key={hora}
                    className="border-b border-gray-200 px-2 py-1 text-xs text-muted-foreground text-right"
                    style={{ minHeight: `${alturaPorHora}px` }}
                  >
                    {hora.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

                                                         {/* Columnas de días */}
              {days.map((day) => {
                const reservasDia = getReservasForDate(day);
                const esHoy = isToday(day);

                const reservasConPosiciones = calcularPosicionesReservasPorDia(reservasDia);

                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r last:border-r-0 relative ${esHoy ? 'bg-blue-50/30' : 'bg-white'}`}                                                     
                    style={{ minHeight: `${alturaTotal}px` }}
                  >
                    {/* Líneas de horas */}
                    {horas.map((hora) => (
                      <div
                        key={`line-${day.toISOString()}-${hora}`}
                        className="absolute left-0 right-0 border-b border-gray-200"                                                                            
                        style={{ top: `${(hora - horaInicioVisible) * alturaPorHora}px` }}                                                                      
                      />
                    ))}

                                                                                                                                                                       {/* Barras finas para cada grupo de reservas */}
                       {reservasConPosiciones.map((grupo, index) => {
                         const { reservas, inicio, fin, columna, estado } = grupo;
                         if (!reservas || reservas.length === 0) return null;
                         const cantidadReservas = reservas.length;
                         const horaInicio = inicio.getHours() + inicio.getMinutes() / 60;
                         const horaFin = fin.getHours() === 0 && fin.getMinutes() === 0 ? 24 : fin.getHours() + fin.getMinutes() / 60;

                        // Si está fuera del rango visible, no mostrarlo
                        if (horaFin <= horaInicioVisible || horaInicio >= horaFinVisible) {
                          return null;
                        }

                                                                                                   const top = Math.max(0, (horaInicio - horaInicioVisible) * alturaPorHora);
                          const altura = Math.max(2, (horaFin - horaInicio) * alturaPorHora);
                          
                          // Ancho fijo de 8px para todas las barras
                          const anchoFijo = 8;
                          const paddingLateral = 2; // margen desde el borde izquierdo
                          const separacionEntreBarras = 2; // espacio entre barras en px
                          // Calcular posición horizontal: una al lado de la otra sin solaparse
                          const left = paddingLateral + (columna * (anchoFijo + separacionEntreBarras));

                          // Usar el estado del grupo (ya está normalizado)
                          const estadoNormalizado = estado?.toUpperCase() || 'APROBADO';
                          const reservaPrincipal = reservas[0];
                          
                          const colorConfig = getColorConfigByEstado(estadoNormalizado, columna);
                          const tituloTooltip = cantidadReservas > 1 
                            ? `${cantidadReservas} reservas de ${formatTime(inicio.toISOString())} a ${formatTime(fin.toISOString())}`
                            : `${reservaPrincipal.espacioNombre} - ${formatTime(inicio.toISOString())} a ${formatTime(fin.toISOString())}`;

                                                                                                           return (
                              <ReservationBar
                                key={`barra-${day.toISOString()}-${inicio.getTime()}-${fin.getTime()}-${index}`}
                                top={top}
                                left={left}
                                anchoFijo={anchoFijo}
                                altura={altura}
                                colorConfig={colorConfig}
                                tituloTooltip={tituloTooltip}
                                zIndex={10 + index}
                                reserva={reservaPrincipal}
                                onViewDetails={onViewDetails}
                              />
                          );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Resumen de la semana */}
        {renderResumenSemana(days, getReservasForDate)}
      </div>
    );
  };

  // Renderizar vista de mes
  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    // Asegurar que empiece en lunes
    const firstDay = startOfWeek(start, { weekStartsOn: 1 });
    const lastDay = endOfWeek(end, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: firstDay, end: lastDay });

    const reservasMes = getReservasForRange(start, end);
    const reservasPorDia = new Map<string, Reserva[]>();
    
    reservasMes.forEach(reserva => {
      // Filtrar pendientes para analistas/admin (no deben aparecer en la vista principal)
      if (reserva.estado === 'PENDIENTE' && !showPendienteFilter) {
        return;
      }
      const fechaReserva = new Date(reserva.inicio);
      const key = format(fechaReserva, 'yyyy-MM-dd');
      if (!reservasPorDia.has(key)) {
        reservasPorDia.set(key, []);
      }
      reservasPorDia.get(key)!.push(reserva);
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Encabezados de días */}
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-xs font-medium text-muted-foreground text-center py-2">
              {day}
            </div>
          ))}
          
          {/* Días del calendario */}
          {allDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const reservasDia = reservasPorDia.get(key) || [];
            const esHoy = isToday(day);
            const esDelMes = isSameMonth(day, currentDate);
            
            // Contar reservas por estado
            const confirmadas = reservasDia.filter(r => r.estado === 'APROBADO').length;
            const canceladas = reservasDia.filter(r => r.estado === 'CANCELADO').length;
            const pendientes = reservasDia.filter(r => r.estado === 'PENDIENTE').length;
            const tieneReservas = reservasDia.length > 0;

            const getDayBgClass = () => {
              if (esHoy) return 'bg-blue-50 border-blue-200';
              if (esDelMes) return 'bg-white border-gray-200';
              return 'bg-gray-50 border-gray-100';
            };
            const getDayTextClass = () => {
              if (esHoy) return 'text-blue-700';
              if (esDelMes) return '';
              return 'text-muted-foreground';
            };
            return (
              <button
                type="button"
                key={day.toISOString()}
                className={`min-h-[100px] border rounded-lg p-1.5 cursor-pointer transition-all hover:shadow-md text-left bg-transparent w-full ${getDayBgClass()}`}
                onClick={() => {
                  if (tieneReservas) {
                    setCurrentDate(day);
                    setCalendarViewMode('day');
                  }
                }}
                aria-label={`Día ${format(day, 'd')}`}
              >
                <div className={`text-xs font-medium mb-2 ${getDayTextClass()}`}>
                  {format(day, 'd')}
                </div>
                
                {tieneReservas ? (
                  <div className="flex flex-col gap-1.5">
                    {/* Iconos con contadores */}
                    {confirmadas > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <span className="text-[9px] font-medium text-foreground">{confirmadas}</span>
                      </div>
                    )}
                    {pendientes > 0 && (
                      <div className="flex items-center gap-1">
                        <Hourglass className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span className="text-[9px] font-medium text-foreground">{pendientes}</span>
                      </div>
                    )}
                    {canceladas > 0 && (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        <span className="text-[9px] font-medium text-foreground">{canceladas}</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={isFullScreen ? 'fixed inset-0 z-50 bg-background p-4 overflow-y-auto' : 'h-full flex flex-col'}>
      <Card className={isFullScreen ? 'min-h-full flex flex-col' : 'h-full flex flex-col'}>
        <CardHeader className={`pb-3 ${isFullScreen ? 'flex-shrink-0' : ''}`}>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <ReservationFilters
                tiempoFilter={tiempoFilter}
                estadoFilter={estadoFilter}
                espacioFilter={espacioFilter}
                carreraFilter={carreraFilter ?? null}
                tipoEspacioFilter={tipoEspacioFilter ?? null}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                espaciosUnicos={espaciosUnicos}
                carrerasUnicas={carrerasUnicas}
                tiposEspacioUnicos={tiposEspacioUnicos}
                hayFiltrosActivos={hayFiltrosActivos}
                showPendienteFilter={showPendienteFilter}
                hideEstadoFilter={hideEstadoFilter}
                onTiempoFilterChange={onTiempoFilterChange}
                onEstadoFilterChange={onEstadoFilterChange}
                onEspacioFilterChange={onEspacioFilterChange}
                onCarreraFilterChange={onCarreraFilterChange ?? (() => {})}
                onTipoEspacioFilterChange={onTipoEspacioFilterChange ?? (() => {})}
                onFechaInicioChange={onFechaInicioChange}
                onFechaFinChange={onFechaFinChange}
                onClearFilters={onClearFilters}
              />
            </div>
            {!readOnly && (
              <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            )}
            {handleToggleFullScreen && (
              <FullScreenToggle isFullScreen={isFullScreen} onToggle={handleToggleFullScreen} />
            )}
          </div>
        </CardHeader>
      <CardContent className="pt-0 relative flex-1 flex flex-col min-h-0">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          </div>
        )}
        {/* Controles de navegación y vista */}
        <div className={`flex flex-col gap-2 mb-4 ${isFullScreen ? 'flex-shrink-0' : ''}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-8 px-3 text-xs"
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Selector de modo de vista */}
            <div className="flex items-center gap-2">
              {/* Botón toggle para ocultar horas nocturnas - visible en vista día y semana */}
              {(calendarViewMode === 'day' || calendarViewMode === 'week') && (
                <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setHideNightHours(!hideNightHours)}
                        className={`p-1.5 rounded transition-colors ${
                          hideNightHours
                            ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Moon className={`h-3.5 w-3.5 ${hideNightHours ? 'text-blue-600' : 'text-gray-500'}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {hideNightHours ? 'Ocultar horas nocturnas (activo)' : 'Mostrar horas nocturnas'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarViewMode('day')}
                  className={`h-7 px-2 text-xs ${calendarViewMode === 'day' ? 'bg-white shadow-sm' : ''}`}
                >
                  Día
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarViewMode('week')}
                  className={`h-7 px-2 text-xs ${calendarViewMode === 'week' ? 'bg-white shadow-sm' : ''}`}
                >
                  Semana
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarViewMode('month')}
                  className={`h-7 px-2 text-xs ${calendarViewMode === 'month' ? 'bg-white shadow-sm' : ''}`}
                >
                  Mes
                </Button>
              </div>
            </div>
          </div>
          
          {/* Fecha - siempre abajo */}
          <div className="text-sm font-medium px-2">
            {calendarViewMode === 'day' && format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            {calendarViewMode === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: es })}`}
            {calendarViewMode === 'month' && format(currentDate, "MMMM yyyy", { locale: es })}
          </div>
        </div>

        {/* Contenido según el modo */}
        <div>
          {calendarViewMode === 'day' && renderDayView()}
          {calendarViewMode === 'week' && renderWeekView()}
          {calendarViewMode === 'month' && renderMonthView()}
        </div>
      </CardContent>
      </Card>
    </div>
  );
}

