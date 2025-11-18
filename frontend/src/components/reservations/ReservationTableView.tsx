import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, Users, Eye, X, Maximize2, Minimize2, Loader2, LayoutGrid, Table as TableIcon, CalendarDays } from 'lucide-react';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { getEstadoConfig, formatTime, formatShortDate } from './reservationUtils';
import ReservationFilters from './ReservationFilters';

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
  titulo: string;
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
  viewMode: 'cards' | 'table' | 'calendar';
  hayFiltrosActivos: boolean;
  onTiempoFilterChange: (filter: string) => void;
  onEstadoFilterChange: (filter: string) => void;
  onEspacioFilterChange: (filter: number | null) => void;
  onCarreraFilterChange: (filter: number | null) => void;
  onTipoEspacioFilterChange: (filter: number | null) => void;
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
}: ReservationTableViewProps) {
  
  const renderPagination = () => {
    if (!onPageChange || totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
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
            {/* Botón de cambio de vista - a la izquierda del botón de pantalla completa */}
            <div className="flex items-center border rounded-lg p-0.5 bg-gray-50 flex-shrink-0 self-start">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewModeChange('cards')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'cards'
                        ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Vista de tarjetas</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewModeChange('table')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'table'
                        ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Vista de tabla</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewModeChange('calendar')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'calendar'
                        ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Vista de calendario</TooltipContent>
              </Tooltip>
            </div>
            {/* Botón de pantalla completa - siempre a la derecha */}
            {onToggleFullScreen && (
              <div className="flex items-center border rounded-lg p-0.5 bg-gray-50 flex-shrink-0 self-start">
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
            <PermissionGuard requiredPermissions={['reservas:crear', 'reservas:solicitar']}>
              <EmptyState
                icon={Calendar}
                title="No hay reservas"
                description="No tienes reservas con los filtros seleccionados"
                action={{
                  label: 'Crear reserva',
                  onClick: onCreateReserva
                }}
              />
            </PermissionGuard>
          </div>
        ) : (
          <div className="rounded-md border">
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 py-2">Espacio</TableHead>
                  <TableHead className="h-9 py-2 hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="h-9 py-2">Horario</TableHead>
                  <TableHead className="h-9 py-2 hidden lg:table-cell">Capacidad</TableHead>
                  <TableHead className="h-9 py-2">Estado</TableHead>
                  <TableHead className="h-9 py-2 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservas.map((reserva) => {
                  const estadoConfig = getEstadoConfig(reserva.estado);
                  const esFutura = new Date(reserva.inicio) > new Date();
                  const esPasada = !esFutura;

                  return (
                    <TableRow
                      key={reserva.id}
                      className={`hover:bg-gray-50/50 ${esPasada ? 'opacity-75' : ''}`}
                    >
                      <TableCell className="py-2 relative">
                        {/* Indicador tipo esquina doblada en la esquina superior izquierda */}
                        <div className={`absolute top-0 left-0 w-0 h-0 ${estadoConfig.cornerBorderColor} border-r-transparent border-r-[12px] border-t-[12px] pointer-events-none`} />
                        <div className="min-w-0">
                          <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium truncate ${esPasada ? 'text-muted-foreground' : ''}`}>
                            {/* Punto de color del tipo de espacio */}
                            {reserva.tipoEspacioColor ? (
                              <div 
                                className="w-2 h-2 rounded-full shrink-0" 
                                style={{ backgroundColor: reserva.tipoEspacioColor }}
                                title={reserva.tipoEspacioNombre || 'Tipo de espacio'}
                              />
                            ) : null}
                            <span className="truncate">{reserva.espacioNombre}</span>
                          </div>
                          {/* Fecha visible solo en móviles */}
                          <div className={`flex items-center gap-1 text-xs text-muted-foreground md:hidden mt-0.5`}>
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
                        {estadoConfig.icon ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help inline-flex">
                                <estadoConfig.icon
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
                          {/* Botón Ver como icono */}
                          <PermissionGuard requiredPermission="reservas:leer">
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
                          </PermissionGuard>
                          {!esPasada && esFutura && reserva.estado === 'APROBADO' && (
                            <PermissionGuard requiredPermission="reservas:cancelar">
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
                            </PermissionGuard>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </UITable>
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

