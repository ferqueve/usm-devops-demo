import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, MapPin, Users, Eye, X, Loader2 } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import { getEstadoConfig, formatTime, formatShortDate } from './reservationUtils';
import ReservationFilters from './ReservationFilters';
import PermissionGuard from '@/components/auth/PermissionGuard';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

interface ReservationCardViewProps {
  reservas: Reserva[];
  espaciosUnicos: Espacio[];
  carrerasUnicas: Carrera[];
  tiposEspacioUnicos: TipoEspacio[];
  // Filtros
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
  // Acciones
  onCreateReserva: () => void;
  onViewDetails: (reserva: Reserva) => void;
  onCancelReserva: (reserva: Reserva) => void;
  // Pantalla completa
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  // Paginación
  page?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
  // Loading
  loading?: boolean;
}

interface ReservaCardItemProps {
  reserva: Reserva;
  onViewDetails: (reserva: Reserva) => void;
  onCancelReserva: (reserva: Reserva) => void;
}

function ReservaCardItem({ reserva, onViewDetails, onCancelReserva }: Readonly<ReservaCardItemProps>) {
  const estadoConfig = getEstadoConfig(reserva.estado);
  const { esFutura, esPasada } = getReservaTemporal(reserva.inicio);
  const EstadoIcon = estadoConfig.icon;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl ${estadoConfig.borderColor} border-r border-t border-b transition-all hover:shadow-sm ${esPasada ? 'bg-muted/50 border-border' : 'border-border hover:border-border bg-card'}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${estadoConfig.stripeColor}`} />
      <div className="p-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex-shrink-0">
            {reserva.espacioImagen ? (
              <img
                src={reserva.espacioImagen}
                alt={reserva.espacioNombre}
                className={`w-12 h-12 rounded-xl object-cover ${esPasada ? 'opacity-60 grayscale' : ''}`}
              />
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${esPasada ? 'bg-secondary opacity-60' : 'bg-muted'}`}>
                <MapPin className={`h-6 w-6 ${esPasada ? 'text-muted-foreground' : 'text-muted-foreground'}`} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {EstadoIcon ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`${estadoConfig.iconColor} shrink-0`}>
                      <EstadoIcon className="h-3.5 w-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{estadoConfig.label}</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
              {reserva.tipoEspacioColor ? (
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: reserva.tipoEspacioColor }}
                  title={reserva.tipoEspacioNombre || 'Tipo de espacio'}
                />
              ) : null}
              <h3 className={`text-sm font-semibold truncate ${esPasada ? 'text-muted-foreground' : ''}`}>
                {reserva.titulo || reserva.espacioNombre}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">{formatShortDate(reserva.inicio)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="truncate">{formatTime(reserva.inicio)} - {formatTime(reserva.fin)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 shrink-0" />
                <span>Cap. {reserva.capacidadEspacio}</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
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
        </div>
      </div>
    </div>
  );
}

export default function ReservationCardView({
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
}: Readonly<ReservationCardViewProps>) {
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
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {reservas.map((reserva) => (
                <ReservaCardItem
                  key={reserva.id}
                  reserva={reserva}
                  onViewDetails={onViewDetails}
                  onCancelReserva={onCancelReserva}
                />
              ))}
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
