import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, Users, Eye, X, Loader2 } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import PermissionGuard from '@/components/auth/PermissionGuard';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getEstadoConfig, formatTime, formatShortDate } from './reservationUtils';
import ReservationFilters from './ReservationFilters';
import {
  FullScreenToggle,
  ReservationListPagination,
  ViewModeToggle,
  type ReservationViewMode,
} from './_shared/ReservationListChrome';
import { getReservaTemporal } from './_shared/reservationTemporal';

interface Espacio {
  id: number;
  nombre: string;
}

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

interface ReservationTableViewProps {
  reservas: Reserva[];
  espaciosUnicos: Espacio[];
  carrerasUnicas: Carrera[];
  tiposEspacioUnicos: TipoEspacio[];
  tiempoFilter: string;
  estadoFilter: string;
  espacioFilter: number | null;
  carreraFilter: number | null;
  tipoEspacioFilter: number | null;
  fechaInicio: Date | undefined;
  fechaFin: Date | undefined;
  viewMode: ReservationViewMode;
  hayFiltrosActivos: boolean;
  showPendienteFilter?: boolean;
  onTiempoFilterChange: (filter: string) => void;
  onEstadoFilterChange: (filter: string) => void;
  onEspacioFilterChange: (filter: number | null) => void;
  onCarreraFilterChange: (filter: number | null) => void;
  onTipoEspacioFilterChange: (filter: number | null) => void;
  onFechaInicioChange: (date: Date | undefined) => void;
  onFechaFinChange: (date: Date | undefined) => void;
  onViewModeChange: (mode: ReservationViewMode) => void;
  onClearFilters: () => void;
  onCreateReserva: () => void;
  onViewDetails: (reserva: Reserva) => void;
  onCancelReserva: (reserva: Reserva) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  page?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

interface ReservaTableRowProps {
  reserva: Reserva;
  onViewDetails: (reserva: Reserva) => void;
  onCancelReserva: (reserva: Reserva) => void;
}

function ReservaTableRow({ reserva, onViewDetails, onCancelReserva }: Readonly<ReservaTableRowProps>) {
  const estadoConfig = getEstadoConfig(reserva.estado);
  const { esFutura, esPasada } = getReservaTemporal(reserva.inicio);
  const EstadoIcon = estadoConfig.icon;

  return (
    <TableRow className={`hover:bg-muted/50 ${esPasada ? 'opacity-75' : ''}`}>
      <TableCell className="py-2 relative">
        <div className={`absolute top-0 left-0 w-0 h-0 ${estadoConfig.cornerBorderColor} border-r-transparent border-r-[12px] border-t-[12px] pointer-events-none`} />
        <div className="min-w-0">
          <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium truncate ${esPasada ? 'text-muted-foreground' : ''}`}>
            {reserva.tipoEspacioColor ? (
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: reserva.tipoEspacioColor }}
                title={reserva.tipoEspacioNombre || 'Tipo de espacio'}
              />
            ) : null}
            <span className="truncate" title={reserva.titulo || reserva.espacioNombre}>
              {reserva.titulo || reserva.espacioNombre}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground md:hidden mt-0.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatShortDate(reserva.inicio)}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-2 hidden md:table-cell">
        <div className={`flex items-center gap-1.5 text-xs sm:text-sm ${esPasada ? 'text-muted-foreground' : ''}`}>
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{formatShortDate(reserva.inicio)}</span>
        </div>
      </TableCell>
      <TableCell className="py-2">
        <div className={`flex items-center gap-1 text-xs sm:text-sm ${esPasada ? 'text-muted-foreground' : ''}`}>
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">{formatTime(reserva.inicio)} - {formatTime(reserva.fin)}</span>
        </div>
      </TableCell>
      <TableCell className="py-2 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <Users className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className={esPasada ? 'text-muted-foreground' : ''}>{reserva.capacidadEspacio}</span>
        </div>
      </TableCell>
      <TableCell className="py-2">
        {EstadoIcon ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help inline-flex">
                <EstadoIcon
                  className={`h-4 w-4 ${estadoConfig.iconColor}`}
                  aria-label={estadoConfig.label}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{estadoConfig.label}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Badge className={`${estadoConfig.color} border text-xs font-medium`}>
            {estadoConfig.label}
          </Badge>
        )}
      </TableCell>
      <TableCell className="py-2 text-right">
        <div className="flex justify-end gap-2">
          <PermissionGuard requiredPermission="reserva:ver_todas">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewDetails(reserva)}
                  className="p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver detalles</p>
              </TooltipContent>
            </Tooltip>
          </PermissionGuard>
          {!esPasada && esFutura && reserva.estado === 'APROBADO' && (
            <PermissionGuard requiredPermission="reserva:cancelar">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onCancelReserva(reserva)}
                    className="p-1.5 rounded transition-colors text-danger-texto hover:text-danger-texto hover:bg-danger-suave"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancelar reserva</p>
                </TooltipContent>
              </Tooltip>
            </PermissionGuard>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ReservationTableView({
  reservas,
  espaciosUnicos,
  carrerasUnicas,
  tiposEspacioUnicos,
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
  onTiempoFilterChange,
  onEstadoFilterChange,
  onEspacioFilterChange,
  onCarreraFilterChange,
  onTipoEspacioFilterChange,
  onFechaInicioChange,
  onFechaFinChange,
  onViewModeChange,
  onClearFilters,
  onCreateReserva,
  onViewDetails,
  onCancelReserva,
  isFullScreen = false,
  onToggleFullScreen,
  page = 0,
  totalPages = 0,
  totalElements = 0,
  onPageChange,
  loading = false,
}: Readonly<ReservationTableViewProps>) {
  const showPagination = !!onPageChange && totalPages > 1;

  return (
    <div className={isFullScreen ? 'fixed inset-0 z-50 bg-background p-4 overflow-y-auto' : 'h-full flex flex-col'}>
      <Card className={isFullScreen ? 'min-h-full flex flex-col' : 'h-full flex flex-col'}>
        <CardHeader className="shrink-0 pb-3">
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <ReservationFilters
                tiempoFilter={tiempoFilter}
                estadoFilter={estadoFilter}
                espacioFilter={espacioFilter}
                carreraFilter={carreraFilter}
                tipoEspacioFilter={tipoEspacioFilter}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                espaciosUnicos={espaciosUnicos}
                carrerasUnicas={carrerasUnicas}
                tiposEspacioUnicos={tiposEspacioUnicos}
                hayFiltrosActivos={hayFiltrosActivos}
                showPendienteFilter={showPendienteFilter}
                onTiempoFilterChange={onTiempoFilterChange}
                onEstadoFilterChange={onEstadoFilterChange}
                onEspacioFilterChange={onEspacioFilterChange}
                onCarreraFilterChange={onCarreraFilterChange}
                onTipoEspacioFilterChange={onTipoEspacioFilterChange}
                onFechaInicioChange={onFechaInicioChange}
                onFechaFinChange={onFechaFinChange}
                onClearFilters={onClearFilters}
              />
            </div>
            <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            {onToggleFullScreen && (
              <FullScreenToggle isFullScreen={isFullScreen} onToggle={onToggleFullScreen} />
            )}
          </div>
        </CardHeader>
        <CardContent className={`pt-0 relative flex-1 flex flex-col min-h-0 ${isFullScreen ? '' : 'overflow-y-auto'}`}>
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Cargando...</p>
              </div>
            </div>
          )}
          {reservas.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <PermissionGuard requiredPermissions={['reserva:crear']}>
                <EmptyState
                  icon={Calendar}
                  title="No hay reservas"
                  description="No tienes reservas con los filtros seleccionados"
                  action={{
                    label: 'Crear reserva',
                    onClick: onCreateReserva,
                  }}
                />
              </PermissionGuard>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 rounded-md border">
              <UITable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Espacio</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead className="hidden lg:table-cell">Capacidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservas.map((reserva) => (
                    <ReservaTableRow
                      key={reserva.id}
                      reserva={reserva}
                      onViewDetails={onViewDetails}
                      onCancelReserva={onCancelReserva}
                    />
                  ))}
                </TableBody>
              </UITable>
            </div>
          )}
          {reservas.length > 0 && showPagination && onPageChange && (
            <div className="mt-4 pt-4 border-t flex-shrink-0">
              <ReservationListPagination
                page={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
              <div className="text-sm text-muted-foreground text-center mt-2">
                Mostrando {reservas.length} de {totalElements} reservas
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
