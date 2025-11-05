import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import type { Reserva } from '@/lib/types/spaces';
import ReservationFormDialog from './ReservationFormDialog.tsx';
import ReservationDetailsDialog from './ReservationDetailsDialog.tsx';
import ReservationStats from './ReservationStats.tsx';
import ReservationCardView from './ReservationCardView.tsx';
import ReservationTableView from './ReservationTableView.tsx';
import ReservationCalendarView from './ReservationCalendarView.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewMode = 'cards' | 'table' | 'calendar';

export default function ReservationManagement() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [contentLoading, setContentLoading] = useState(false); // Loading solo para el contenido de table/cards
  const [calendarLoading, setCalendarLoading] = useState(false); // Loading solo para calendar
  const [estadoFilter, setEstadoFilter] = useState<string>('todas');
  const [tiempoFilter, setTiempoFilter] = useState<string>('todas');
  const [espacioFilter, setEspacioFilter] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [reservaToCancel, setReservaToCancel] = useState<Reserva | null>(null);
  
  // Estado de paginación (solo para vista de tabla y cards)
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchReservas = async () => {
    setCalendarLoading(true); // Solo afecta al contenido de calendar
    try {
      const response = await reservationsApi.obtenerMisReservas();
      if (response.data) {
        // Ordenar por fecha descendente
        const sorted = response.data.sort((a, b) =>
          new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
        );
        setReservas(sorted);
      }
    } catch (error: any) {
      toast.error('Error al cargar reservas', {
        description: error.message || 'No se pudieron cargar las reservas'
      });
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchReservasPaged = async () => {
    setContentLoading(true); // Solo afecta al contenido
    try {
      const response = await reservationsApi.obtenerMisReservasPaged(
        page,
        pageSize,
        estadoFilter,
        espacioFilter,
        fechaInicio,
        fechaFin,
        tiempoFilter
      );
      if (response.data) {
        setReservas(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      }
    } catch (error: any) {
      toast.error('Error al cargar reservas', {
        description: error.message || 'No se pudieron cargar las reservas'
      });
    } finally {
      setContentLoading(false);
    }
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Prevenir scroll del body y html cuando está en pantalla completa
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isFullScreen]);

  // Cargar reservas sin paginación para calendar
  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchReservas();
    }
  }, [viewMode]);

  // Resetear página cuando cambian filtros o vista (solo para table y cards)
  // Esto se ejecuta antes del useEffect que carga los datos
  useEffect(() => {
    if (viewMode === 'table' || viewMode === 'cards') {
      setPage(0);
    }
  }, [viewMode, estadoFilter, tiempoFilter, espacioFilter, fechaInicio, fechaFin]);

  // Cargar reservas con paginación para table y cards
  // Se ejecuta cuando cambia la página o los filtros
  useEffect(() => {
    if (viewMode === 'table' || viewMode === 'cards') {
      fetchReservasPaged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, page, estadoFilter, tiempoFilter, espacioFilter, fechaInicio, fechaFin]);

  const handleCreateSuccess = () => {
    if (viewMode === 'calendar') {
      fetchReservas();
    } else {
      fetchReservasPaged();
    }
    // El toast de éxito ya se muestra en ReservationFormDialog
  };

  const handleCancelReserva = (reserva: Reserva) => {
    setReservaToCancel(reserva);
    setCancelDialog(true);
  };

  const confirmCancelReserva = async () => {
    if (!reservaToCancel) return;
    
    try {
      await reservationsApi.cancelarReserva(reservaToCancel.id);
      toast.success('Reserva cancelada exitosamente');
      if (viewMode === 'calendar') {
        fetchReservas();
      } else {
        fetchReservasPaged();
      }
      setCancelDialog(false);
      setReservaToCancel(null);
    } catch (error: any) {
      toast.error('Error al cancelar reserva', {
        description: error.message || 'No se pudo cancelar la reserva'
      });
    }
  };

  const handleViewDetails = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setDetailsDialog(true);
  };

  const handleClearFilters = () => {
    setEstadoFilter('todas');
    setTiempoFilter('todas');
    setEspacioFilter(null);
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setPage(0); // Resetear a primera página cuando se limpian filtros
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = estadoFilter !== 'todas' || 
    tiempoFilter !== 'todas' || 
    espacioFilter !== null || 
    fechaInicio !== undefined || 
    fechaFin !== undefined;

  // Obtener espacios únicos de las reservas (para calendar, usar todas las reservas; para table/cards, necesitaríamos cargar todos los espacios)
  // Por ahora, obtenemos de las reservas cargadas
  const espaciosUnicos = Array.from(
    new Map(reservas.map(r => [r.espacioId, r.espacioNombre])).entries()
  ).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Para calendar, filtrar en el cliente (porque carga todas las reservas)
  // Para table y cards, el filtrado se hace en el servidor
  const ahora = new Date();
  const reservasFiltradas = viewMode === 'calendar' 
    ? reservas.filter(reserva => {
        // Filtro por estado
        if (estadoFilter !== 'todas' && reserva.estado !== estadoFilter) {
          return false;
        }
        // Filtro por tiempo
        if (tiempoFilter === 'futuras') {
          return new Date(reserva.inicio) > ahora;
        } else if (tiempoFilter === 'pasadas') {
          return new Date(reserva.inicio) <= ahora;
        }
        // Filtro por espacio
        if (espacioFilter !== null && reserva.espacioId !== espacioFilter) {
          return false;
        }
        // Filtro por rango de fechas
        if (fechaInicio || fechaFin) {
          const fechaReserva = new Date(reserva.inicio);
          const inicioDate = fechaInicio ? new Date(fechaInicio) : null;
          const finDate = fechaFin ? new Date(fechaFin) : null;
          
          if (inicioDate) {
            inicioDate.setHours(0, 0, 0, 0);
          }
          if (finDate) {
            finDate.setHours(23, 59, 59, 999);
          }
          fechaReserva.setHours(0, 0, 0, 0);
          
          if (inicioDate && fechaReserva < inicioDate) {
            return false;
          }
          if (finDate && fechaReserva > finDate) {
            return false;
          }
        }
        return true;
      })
    : reservas; // Para table y cards, las reservas ya vienen filtradas del servidor


  // Obtener título dinámico según filtros
  const getTituloReservas = () => {
    if (tiempoFilter === 'futuras') return 'Reservas Futuras';
    if (tiempoFilter === 'pasadas') return 'Reservas Pasadas';
    return 'Mis Reservas';
  };

  // Renderizar vista de cards
  const renderCardView = (reservasLista: Reserva[], titulo: string) => {
    return (
      <ReservationCardView
        reservas={reservasLista}
        titulo={titulo}
        espaciosUnicos={espaciosUnicos}
        tiempoFilter={tiempoFilter}
        estadoFilter={estadoFilter}
        espacioFilter={espacioFilter}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        viewMode={viewMode}
        hayFiltrosActivos={hayFiltrosActivos}
        onTiempoFilterChange={(filter) => { setTiempoFilter(filter); setPage(0); }}
        onEstadoFilterChange={(filter) => { setEstadoFilter(filter); setPage(0); }}
        onEspacioFilterChange={(filter) => { setEspacioFilter(filter); setPage(0); }}
        onFechaInicioChange={(date) => { setFechaInicio(date); setPage(0); }}
        onFechaFinChange={(date) => { setFechaFin(date); setPage(0); }}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
        onCreateReserva={() => setCreateDialog(true)}
        onViewDetails={handleViewDetails}
        onCancelReserva={handleCancelReserva}
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
        // Props de paginación
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={handlePageChange}
        loading={contentLoading}
      />
    );
  };

  // Renderizar vista de tabla
  const renderTableView = (reservasLista: Reserva[], titulo: string) => {
    return (
      <ReservationTableView
        reservas={reservasLista}
        titulo={titulo}
        espaciosUnicos={espaciosUnicos}
        tiempoFilter={tiempoFilter}
        estadoFilter={estadoFilter}
        espacioFilter={espacioFilter}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        viewMode={viewMode}
        hayFiltrosActivos={hayFiltrosActivos}
        onTiempoFilterChange={(filter) => { setTiempoFilter(filter); setPage(0); }}
        onEstadoFilterChange={(filter) => { setEstadoFilter(filter); setPage(0); }}
        onEspacioFilterChange={(filter) => { setEspacioFilter(filter); setPage(0); }}
        onFechaInicioChange={(date) => { setFechaInicio(date); setPage(0); }}
        onFechaFinChange={(date) => { setFechaFin(date); setPage(0); }}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
        onCreateReserva={() => setCreateDialog(true)}
        onViewDetails={handleViewDetails}
        onCancelReserva={handleCancelReserva}
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
        // Props de paginación
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={handlePageChange}
        loading={contentLoading}
      />
    );
  };

  // Renderizar vista de calendario
  const renderCalendarView = (reservasLista: Reserva[]) => {
    return (
      <ReservationCalendarView
        reservas={reservasLista}
        espaciosUnicos={espaciosUnicos}
        tiempoFilter={tiempoFilter}
        estadoFilter={estadoFilter}
        espacioFilter={espacioFilter}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        viewMode={viewMode}
        hayFiltrosActivos={hayFiltrosActivos}
        onTiempoFilterChange={setTiempoFilter}
        onEstadoFilterChange={setEstadoFilter}
        onEspacioFilterChange={setEspacioFilter}
        onFechaInicioChange={setFechaInicio}
        onFechaFinChange={setFechaFin}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
        onCreateReserva={() => setCreateDialog(true)}
        onViewDetails={handleViewDetails}
        onCancelReserva={handleCancelReserva}
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
        loading={calendarLoading}
      />
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Mis Reservas</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra tus reservas de espacios
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nueva Reserva</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      {/* Layout principal: Gestión + Stats lateral */}
      <div className="flex gap-4 sm:gap-6 flex-col lg:flex-row">
        {/* Gestión de reservas (70%) */}
        <div className="flex-1 space-y-4 sm:space-y-6">
          {/* Lista unificada de reservas */}
          {viewMode === 'cards' && renderCardView(reservasFiltradas, getTituloReservas())}
          {viewMode === 'table' && renderTableView(reservasFiltradas, getTituloReservas())}
          {viewMode === 'calendar' && renderCalendarView(reservasFiltradas)}
        </div>

        {/* Estadísticas en el lateral derecho (30%) - se ajusta automáticamente cuando está colapsada */}
        <div className="w-full lg:w-auto lg:shrink-0 lg:order-last">
          <ReservationStats onRefresh={fetchReservas} />
        </div>
      </div>

      {/* Modales */}
      <ReservationFormDialog
        open={createDialog}
        onOpenChange={setCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      {selectedReserva && (
        <ReservationDetailsDialog
          reserva={selectedReserva}
          open={detailsDialog}
          onOpenChange={setDetailsDialog}
        />
      )}

      {/* Diálogo de confirmación para cancelar reserva */}
      <AlertDialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la reserva{reservaToCancel && ` de ${reservaToCancel.espacioNombre}`}. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCancelDialog(false);
              setReservaToCancel(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelReserva}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, cancelar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
