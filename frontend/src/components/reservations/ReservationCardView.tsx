import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, MapPin, Users, Eye, X, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import { getEstadoConfig, formatTime, formatShortDate } from './reservationUtils';
import ReservationFilters from './ReservationFilters';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface Espacio {
  id: number;
  nombre: string;
}

interface ReservationCardViewProps {
  reservas: Reserva[];
  titulo: string;
  espaciosUnicos: Espacio[];
  // Filtros
  tiempoFilter: string;
  estadoFilter: string;
  espacioFilter: number | null;
  fechaInicio: Date | undefined;
  fechaFin: Date | undefined;
  viewMode: 'cards' | 'table' | 'calendar';
  hayFiltrosActivos: boolean;
  onTiempoFilterChange: (filter: string) => void;
  onEstadoFilterChange: (filter: string) => void;
  onEspacioFilterChange: (filter: number | null) => void;
  onFechaInicioChange: (date: Date | undefined) => void;
  onFechaFinChange: (date: Date | undefined) => void;
  onViewModeChange: (mode: 'cards' | 'table' | 'calendar') => void;
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

export default function ReservationCardView({
  reservas,
  espaciosUnicos,
  tiempoFilter,
  estadoFilter,
  espacioFilter,
  fechaInicio,
  fechaFin,
  viewMode,
  hayFiltrosActivos,
  onTiempoFilterChange,
  onEstadoFilterChange,
  onEspacioFilterChange,
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
}: ReservationCardViewProps) {
  
  const renderPagination = () => {
    if (!onPageChange || totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={(e) => { e.preventDefault(); if (page > 0) onPageChange(page - 1); }}
              className={page === 0 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          
          {startPage > 0 && (
            <>
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); onPageChange(0); }}>1</PaginationLink>
              </PaginationItem>
              {startPage > 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}
          
          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                onClick={(e) => { e.preventDefault(); onPageChange(p); }}
                isActive={p === page}
              >
                {p + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {endPage < totalPages - 1 && (
            <>
              {endPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); onPageChange(totalPages - 1); }}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={(e) => { e.preventDefault(); if (page < totalPages - 1) onPageChange(page + 1); }}
              className={page >= totalPages - 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };
  
  return (
    <div className={isFullScreen ? 'fixed inset-0 z-50 bg-background p-4 overflow-y-auto' : ''}>
      <Card className={isFullScreen ? 'min-h-full flex flex-col' : ''}>
        <CardHeader className={`pb-3 ${isFullScreen ? 'flex-shrink-0' : ''}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <ReservationFilters
                tiempoFilter={tiempoFilter}
                estadoFilter={estadoFilter}
                espacioFilter={espacioFilter}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                viewMode={viewMode}
                espaciosUnicos={espaciosUnicos}
                hayFiltrosActivos={hayFiltrosActivos}
                onTiempoFilterChange={onTiempoFilterChange}
                onEstadoFilterChange={onEstadoFilterChange}
                onEspacioFilterChange={onEspacioFilterChange}
                onFechaInicioChange={onFechaInicioChange}
                onFechaFinChange={onFechaFinChange}
                onViewModeChange={onViewModeChange}
                onClearFilters={onClearFilters}
              />
            </div>
            {/* Botón de pantalla completa - siempre a la derecha */}
            {onToggleFullScreen && (
              <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onToggleFullScreen}
                      className={`p-1.5 rounded transition-colors ${
                        isFullScreen
                          ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {isFullScreen ? (
                        <Minimize2 className={`h-3.5 w-3.5 ${isFullScreen ? 'text-blue-600' : 'text-gray-500'}`} />
                      ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </CardHeader>
      <CardContent className="pt-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          </div>
        )}
        {reservas.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={Calendar}
              title="No hay reservas"
              description="No tienes reservas con los filtros seleccionados"
              action={{
                label: 'Crear reserva',
                onClick: onCreateReserva
              }}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {reservas.map((reserva) => {
              const estadoConfig = getEstadoConfig(reserva.estado);
              const esFutura = new Date(reserva.inicio) > new Date();
              const esPasada = !esFutura;

              return (
                <div
                  key={reserva.id}
                  className={`group relative overflow-hidden rounded-2xl ${estadoConfig.borderColor} border-r border-t border-b transition-all hover:shadow-sm ${
                    esPasada ? 'bg-gray-50/50 border-gray-200' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* Franja de color recta en el lado izquierdo */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${estadoConfig.stripeColor}`} />
                  <div className="p-3">
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Imagen del espacio - más pequeña */}
                      <div className="flex-shrink-0">
                        {reserva.espacioImagen ? (
                          <img
                            src={reserva.espacioImagen}
                            alt={reserva.espacioNombre}
                            className={`w-12 h-12 rounded-xl object-cover ${
                              esPasada ? 'opacity-60 grayscale' : ''
                            }`}
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            esPasada ? 'bg-gray-200 opacity-60' : 'bg-gray-100'
                          }`}>
                            <MapPin className={`h-6 w-6 ${esPasada ? 'text-gray-400' : 'text-gray-500'}`} />
                          </div>
                        )}
                      </div>

                      {/* Contenido principal - más compacto */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Estado como icono con tooltip */}
                          {estadoConfig.icon ? (() => {
                            const EstadoIcon = estadoConfig.icon;
                            return (
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
                            );
                          })() : null}
                          {/* Punto de color del tipo de espacio */}
                          {reserva.tipoEspacioColor ? (
                            <div 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: reserva.tipoEspacioColor }}
                              title={reserva.tipoEspacioNombre || 'Tipo de espacio'}
                            />
                          ) : null}
                          <h3 className={`text-sm font-semibold truncate ${esPasada ? 'text-muted-foreground' : ''}`}>
                            {reserva.espacioNombre}
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

                      {/* Acciones - a la derecha */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {/* Botón Ver como icono */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onViewDetails(reserva)}
                              className="p-1.5 rounded transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver detalles</p>
                          </TooltipContent>
                        </Tooltip>
                        {!esPasada && esFutura && reserva.estado === 'APROBADO' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => onCancelReserva(reserva)}
                                className="p-1.5 rounded transition-colors text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cancelar reserva</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {reservas.length > 0 && renderPagination() && (
          <div className="mt-4 pt-4 border-t">
            {renderPagination()}
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

