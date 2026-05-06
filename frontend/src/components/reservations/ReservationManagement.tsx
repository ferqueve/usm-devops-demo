import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/Button";
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import { espaciosApi } from '@/lib/api/spaces';
import { useEspacios } from '@/hooks/useEspacios';
import { useCarreras } from '@/hooks/useCarreras';
import type { Reserva, TipoEspacio } from '@/lib/types/spaces';
import ReservationDetailsDialog from './ReservationDetailsDialog.tsx';
import ReservationStats from './ReservationStats.tsx';
import ReservationPendientes from './ReservationPendientes.tsx';
import ReservationCardView from './ReservationCardView.tsx';
import ReservationTableView from './ReservationTableView.tsx';
import ReservationCalendarView from './ReservationCalendarView.tsx';
import ReservationFormDialog from './ReservationFormDialog.tsx';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useSearchParams } from 'react-router-dom';
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

interface CalendarFilterContext {
  estadoFilter: string;
  showPendienteFilter: boolean;
  tiempoFilter: string;
  espacioFilter: number | null;
  tipoEspacioFilter: number | null;
  carreraFilter: number | null;
  fechaInicio?: Date;
  fechaFin?: Date;
  ahora: Date;
}

// Determina si una reserva pasa el filtro por estado, considerando reglas para PENDIENTE
function passesEstadoFilter(reserva: Reserva, ctx: CalendarFilterContext): boolean {
  if (ctx.estadoFilter !== 'todas' && reserva.estado !== ctx.estadoFilter) return false;
  if (reserva.estado === 'PENDIENTE' && !ctx.showPendienteFilter) return false;
  return true;
}

// Verifica el filtro temporal (futuras / pasadas / todas)
function passesTiempoFilter(reserva: Reserva, ctx: CalendarFilterContext): boolean {
  const fechaReserva = new Date(reserva.inicio);
  if (ctx.tiempoFilter === 'futuras') return fechaReserva > ctx.ahora;
  if (ctx.tiempoFilter === 'pasadas') return fechaReserva <= ctx.ahora;
  return true;
}

// Verifica los filtros simples por foreign key (espacio, tipo de espacio, carrera)
function passesEntidadFilter(reserva: Reserva, ctx: CalendarFilterContext): boolean {
  if (ctx.espacioFilter !== null && reserva.espacioId !== ctx.espacioFilter) return false;
  if (ctx.tipoEspacioFilter !== null && reserva.tipoEspacioId !== ctx.tipoEspacioFilter) return false;
  if (ctx.carreraFilter !== null && reserva.carreraId !== ctx.carreraFilter) return false;
  return true;
}

// Verifica el filtro por rango de fechas
function passesRangoFechas(reserva: Reserva, ctx: CalendarFilterContext): boolean {
  if (!ctx.fechaInicio && !ctx.fechaFin) return true;
  const fechaReserva = new Date(reserva.inicio);
  fechaReserva.setHours(0, 0, 0, 0);
  if (ctx.fechaInicio) {
    const inicioDate = new Date(ctx.fechaInicio);
    inicioDate.setHours(0, 0, 0, 0);
    if (fechaReserva < inicioDate) return false;
  }
  if (ctx.fechaFin) {
    const finDate = new Date(ctx.fechaFin);
    finDate.setHours(23, 59, 59, 999);
    if (fechaReserva > finDate) return false;
  }
  return true;
}

// Combina todos los filtros para la vista de calendario
function reservaPasaFiltrosCalendario(reserva: Reserva, ctx: CalendarFilterContext): boolean {
  return (
    passesEstadoFilter(reserva, ctx) &&
    passesTiempoFilter(reserva, ctx) &&
    passesEntidadFilter(reserva, ctx) &&
    passesRangoFechas(reserva, ctx)
  );
}

// Para DOCENTE/EXTERNO: filtra el array según el estado pedido
function aplicarFiltroEstadoDocente<T extends { estado: string }>(
  items: T[],
  estadoFilter: string
): T[] {
  if (estadoFilter === 'PENDIENTE') return items.filter(r => r.estado === 'PENDIENTE');
  if (estadoFilter !== 'todas') return items.filter(r => r.estado === estadoFilter);
  return items;
}

// Para ANALISTA/ADMIN: filtra reservas propias o asignadas, excluyendo pendientes
function filtrarReservasParaAnalista(reservas: Reserva[], userId: number): Reserva[] {
  return reservas.filter(reserva => {
    const esPropia = reserva.usuarioId === userId;
    const esAsignada = reserva.analistaId === userId;
    const noEsPendiente = reserva.estado !== 'PENDIENTE';
    return (esPropia || esAsignada) && noEsPendiente;
  });
}

// Para ANALISTA/ADMIN: convierte el filtro de estado al parámetro de la API (excluye 'todas' y PENDIENTE)
function estadoParaApiAnalista(estadoFilter: string): string | undefined {
  return estadoFilter !== 'todas' && estadoFilter !== 'PENDIENTE' ? estadoFilter : undefined;
}

// Para DOCENTE/EXTERNO: convierte el filtro de estado al parámetro de la API
function estadoParaApiDocente(estadoFilter: string): string | undefined {
  if (estadoFilter === 'PENDIENTE') return 'PENDIENTE';
  if (estadoFilter === 'todas') return undefined;
  return estadoFilter;
}

export default function ReservationManagement() {
  const { hasPermission } = useRolePermissions();
  const { user } = useAuth();
  const { preferencias } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();

  // Permission-based logic
  const canApprove = hasPermission('reserva:aprobar'); // ANALISTA/ADMIN can approve
  const canViewRecommendations = hasPermission('recomendacion:ver'); // DOCENTE can view recommendations
  const showPendienteFilter = !canApprove; // DOCENTE/EXTERNO can filter their own pending reservations
  
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [contentLoading, setContentLoading] = useState(false); // Loading solo para el contenido de table/cards
  const [calendarLoading, setCalendarLoading] = useState(false); // Loading solo para calendar
  // Para usuarios que pueden aprobar (analistas/admin), el filtro por defecto es 'APROBADO' (confirmadas), para otros es 'todas'
  const [estadoFilter, setEstadoFilter] = useState<string>(() => {
    return canApprove ? 'APROBADO' : 'todas';
  });
  const [tiempoFilter, setTiempoFilter] = useState<string>('todas');
  const [espacioFilter, setEspacioFilter] = useState<number | null>(null);
  const [carreraFilter, setCarreraFilter] = useState<number | null>(null);
  const [tipoEspacioFilter, setTipoEspacioFilter] = useState<number | null>(null);
  const [usuarioFilter, setUsuarioFilter] = useState<number | null>(null); // Solo para ANALISTA
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  // Vista desde preferencias o por defecto: Calendar para usuarios que pueden aprobar o ver recomendaciones, Cards para otros
  const defaultViewMode: ViewMode = (canApprove || canViewRecommendations) ? 'calendar' : 'cards';
  const preferenciaViewMode = preferencias?.reservasViewMode as ViewMode | undefined;
  const [viewMode, setViewMode] = useState<ViewMode>(preferenciaViewMode || defaultViewMode);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [reservaToCancel, setReservaToCancel] = useState<Reserva | null>(null);
  
  // Estado de paginación (solo para vista de tabla y cards) - desde preferencias
  const [page, setPage] = useState(0);
  const pageSize = preferencias?.reservasPageSize || 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Aplicar preferencias cuando se carguen
  useEffect(() => {
    if (preferencias?.reservasViewMode) {
      setViewMode(preferencias.reservasViewMode as ViewMode);
    }
  }, [preferencias]);
  
  // Reservas pendientes separadas (solo para ANALISTA)
  const [reservasPendientes, setReservasPendientes] = useState<Reserva[]>([]);
  const [pendientesLoading, setPendientesLoading] = useState(false);
  
  // Estado compartido para colapsar/expandir el panel lateral
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Estado para el modal del formulario
  const shouldOpenForm = searchParams.get('new') === 'true';
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(shouldOpenForm);
  
  // Limpiar query param después de abrir
  useEffect(() => {
    if (shouldOpenForm) {
      setSearchParams({}, { replace: true });
      setIsFormDialogOpen(true);
    }
  }, [shouldOpenForm, setSearchParams]);

  const fetchReservas = useCallback(async () => {
    setCalendarLoading(true);
    try {
      let reservasResultado: Reserva[] = [];

      if (showPendienteFilter) {
        const response = await reservationsApi.obtenerMisReservas();
        reservasResultado = aplicarFiltroEstadoDocente(response.data ?? [], estadoFilter);
      } else {
        const response = await reservationsApi.obtenerTodasLasReservas(
          estadoParaApiAnalista(estadoFilter),
          espacioFilter ?? undefined,
          carreraFilter ?? undefined,
          tipoEspacioFilter ?? undefined,
          fechaInicio ?? undefined,
          fechaFin ?? undefined
        );
        reservasResultado = response.data && user?.id
          ? filtrarReservasParaAnalista(response.data, user.id)
          : (response.data ?? []);
      }

      const sorted = reservasResultado.slice().sort((a, b) =>
        new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
      );
      setReservas(sorted);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las reservas';
      toast.error('Error al cargar reservas', { description: errorMessage });
    } finally {
      setCalendarLoading(false);
    }
  }, [showPendienteFilter, user?.id, estadoFilter, espacioFilter, carreraFilter, tipoEspacioFilter, fechaInicio, fechaFin]);

  // Cargar reservas pendientes separadamente (solo para usuarios que pueden aprobar)
  const fetchReservasPendientes = useCallback(async () => {
    if (!canApprove) {
      setReservasPendientes([]);
      return;
    }

    setPendientesLoading(true);
    try {
      const response = await reservationsApi.obtenerTodasLasReservas(
        'PENDIENTE',
        espacioFilter ?? undefined,
        carreraFilter ?? undefined,
        tipoEspacioFilter ?? undefined,
        fechaInicio ?? undefined,
        fechaFin ?? undefined
      );

      if (response.data && user?.id) {
        // Filtrar solo las reservas pendientes asignadas a este analista
        const pendientesFiltradas = response.data.filter((reserva: Reserva) =>
          reserva.analistaId === user.id
        );

        // Ordenar por fecha de creación descendente (más recientes primero)
        const sorted = pendientesFiltradas.slice().sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReservasPendientes(sorted);
      }
    } catch (error: unknown) {
      console.error('Error al cargar reservas pendientes:', error);
      // No mostrar toast para no molestar, solo log
    } finally {
      setPendientesLoading(false);
    }
  }, [canApprove, user?.id, espacioFilter, carreraFilter, tipoEspacioFilter, fechaInicio, fechaFin]);

  const fetchReservasPaged = useCallback(async () => {
    setContentLoading(true);
    try {
      const response = showPendienteFilter
        ? await reservationsApi.obtenerMisReservasPaged({
            page,
            size: pageSize,
            estado: estadoParaApiDocente(estadoFilter),
            espacioId: espacioFilter,
            carreraId: carreraFilter,
            tipoEspacioId: tipoEspacioFilter,
            fechaInicio,
            fechaFin,
            tiempo: tiempoFilter,
          })
        : await reservationsApi.obtenerTodasReservasPaged({
            page,
            size: pageSize,
            estado: estadoParaApiAnalista(estadoFilter),
            espacioId: espacioFilter,
            carreraId: carreraFilter,
            tipoEspacioId: tipoEspacioFilter,
            usuarioId: usuarioFilter,
            fechaInicio,
            fechaFin,
            tiempo: tiempoFilter,
          });

      if (!response.data) return;

      let content = response.data.content;
      if (showPendienteFilter) {
        content = aplicarFiltroEstadoDocente(content, estadoFilter);
      } else if (user?.id) {
        content = filtrarReservasParaAnalista(content, user.id);
      }

      setReservas(content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las reservas';
      toast.error('Error al cargar reservas', { description: errorMessage });
    } finally {
      setContentLoading(false);
    }
  }, [showPendienteFilter, user?.id, page, pageSize, estadoFilter, espacioFilter, carreraFilter, tipoEspacioFilter, usuarioFilter, fechaInicio, fechaFin, tiempoFilter]);

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
  }, [viewMode, fetchReservas]);

  // Cargar reservas pendientes siempre para usuarios que pueden aprobar
  useEffect(() => {
    if (canApprove) {
      fetchReservasPendientes();
    }
  }, [canApprove, fetchReservasPendientes]);

  // Resetear página cuando cambian filtros o vista (solo para table y cards)
  // Esto se ejecuta antes del useEffect que carga los datos
  useEffect(() => {
    if (viewMode === 'table' || viewMode === 'cards') {
      setPage(0);
    }
  }, [viewMode, estadoFilter, tiempoFilter, espacioFilter, carreraFilter, tipoEspacioFilter, usuarioFilter, fechaInicio, fechaFin]);

  // Cargar reservas con paginación para table y cards
  // Se ejecuta cuando cambia la página o los filtros
  useEffect(() => {
    if (viewMode === 'table' || viewMode === 'cards') {
      fetchReservasPaged();
    }
  }, [viewMode, page, fetchReservasPaged]);


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
        if (canApprove) {
          fetchReservasPendientes();
        }
      } else {
        fetchReservasPaged();
      }
      setCancelDialog(false);
      setReservaToCancel(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo cancelar la reserva';
      toast.error('Error al cancelar reserva', {
        description: errorMessage
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
    setCarreraFilter(null);
    setTipoEspacioFilter(null);
    setUsuarioFilter(null);
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
    carreraFilter !== null ||
    tipoEspacioFilter !== null ||
    usuarioFilter !== null ||
    fechaInicio !== undefined || 
    fechaFin !== undefined;

  // Hooks compartidos para carreras, espacios
  const { espacios } = useEspacios();
  const { carreras } = useCarreras();

  // Estados para tipos de espacio (aún no hay hook dedicado)
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);

  // Cargar tipos de espacio para los filtros
  useEffect(() => {
    const fetchTiposEspacio = async () => {
      try {
        const tiposEspacioRes = await espaciosApi.listarTiposEspacio();
        if (tiposEspacioRes?.data) {
          setTiposEspacio(tiposEspacioRes.data);
        }
      } catch (error: unknown) {
        console.error('Error al cargar tipos de espacio:', error);
      }
    };
    fetchTiposEspacio();
  }, []);

  // Obtener espacios únicos (usar todos los espacios cargados, no solo los de las reservas)
  const espaciosUnicos = espacios.map(e => ({ id: e.id, nombre: e.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  // Obtener carreras únicas (filtrar eliminadas)
  const carrerasUnicas = carreras
    .filter(c => !c.deletedAt)
    .map(c => ({ id: c.id, nombre: c.nombre, codigo: c.codigo }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  // Obtener tipos de espacio únicos
  const tiposEspacioUnicos = tiposEspacio
    .map(t => ({ id: t.id, nombre: t.nombre, color: t.color }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  // Obtener usuarios únicos (solo para ANALISTA) - se usará cuando se agregue el filtro de usuario a las vistas
  // const usuariosUnicos = isAnalista
  //   ? usuarios
  //       .filter(u => u.activo !== false)
  //       .map(u => ({ id: u.id, nombre: u.nombre, email: u.email }))
  //       .sort((a, b) => a.nombre.localeCompare(b.nombre))
  //   : [];

  // Para calendar, filtrar en el cliente (porque carga todas las reservas)
  // Para table y cards, usar reservas paginadas del hook
  const ahora = new Date();
  const calendarFilterCtx: CalendarFilterContext = {
    estadoFilter,
    showPendienteFilter,
    tiempoFilter,
    espacioFilter,
    tipoEspacioFilter,
    carreraFilter,
    fechaInicio,
    fechaFin,
    ahora,
  };
  const reservasFiltradas = viewMode === 'calendar'
    ? reservas.filter(reserva => reservaPasaFiltrosCalendario(reserva, calendarFilterCtx))
    : reservas;


  // Construye el prop-bag compartido por las vistas paginadas (cards/table).
  // Ambas reciben el mismo set de filtros, callbacks de filtros que también resetean
  // la paginación y la metadata de paginación.
  const buildPagedListProps = () => ({
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
    showPendienteFilter,
    onTiempoFilterChange: (filter: string) => { setTiempoFilter(filter); setPage(0); },
    onEstadoFilterChange: (filter: string) => {
      // Permitir filtrar por PENDIENTE solo para docentes/externos
      if (filter === 'PENDIENTE' && !showPendienteFilter) {
        setEstadoFilter('todas');
      } else {
        setEstadoFilter(filter);
      }
      setPage(0);
    },
    onEspacioFilterChange: (filter: number | null) => { setEspacioFilter(filter); setPage(0); },
    onCarreraFilterChange: (filter: number | null) => { setCarreraFilter(filter); setPage(0); },
    onTipoEspacioFilterChange: (filter: number | null) => { setTipoEspacioFilter(filter); setPage(0); },
    onFechaInicioChange: (date: Date | undefined) => { setFechaInicio(date); setPage(0); },
    onFechaFinChange: (date: Date | undefined) => { setFechaFin(date); setPage(0); },
    onViewModeChange: setViewMode,
    onClearFilters: handleClearFilters,
    onCreateReserva: () => setIsFormDialogOpen(true),
    onViewDetails: handleViewDetails,
    onCancelReserva: handleCancelReserva,
    isFullScreen,
    onToggleFullScreen: handleToggleFullScreen,
    page,
    totalPages,
    totalElements,
    onPageChange: handlePageChange,
    loading: contentLoading,
  });

  // Renderizar vista de cards
  const renderCardView = (reservasLista: Reserva[]) => (
    <ReservationCardView reservas={reservasLista} {...buildPagedListProps()} />
  );

  // Renderizar vista de tabla
  const renderTableView = (reservasLista: Reserva[]) => (
    <ReservationTableView reservas={reservasLista} {...buildPagedListProps()} />
  );

  // Renderizar vista de calendario
  const renderCalendarView = (reservasLista: Reserva[]) => {
    return (
      <ReservationCalendarView
        reservas={reservasLista}
        espaciosUnicos={espaciosUnicos}
        carrerasUnicas={carrerasUnicas}
        tiposEspacioUnicos={tiposEspacioUnicos}
        tiempoFilter={tiempoFilter}
        estadoFilter={estadoFilter}
        espacioFilter={espacioFilter}
        carreraFilter={carreraFilter}
        tipoEspacioFilter={tipoEspacioFilter}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        viewMode={viewMode}
        hayFiltrosActivos={hayFiltrosActivos}
        showPendienteFilter={showPendienteFilter}
        onTiempoFilterChange={setTiempoFilter}
        onEstadoFilterChange={(filter) => {
          setEstadoFilter(filter);
        }}
        onEspacioFilterChange={setEspacioFilter}
        onCarreraFilterChange={setCarreraFilter}
        onTipoEspacioFilterChange={setTipoEspacioFilter}
        onFechaInicioChange={setFechaInicio}
        onFechaFinChange={setFechaFin}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
        onViewDetails={handleViewDetails}
        onCancelReserva={handleCancelReserva}
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
        loading={calendarLoading}
      />
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-8rem)]">
      <div className="space-y-4 sm:space-y-6 flex-shrink-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {canViewRecommendations && !canApprove ? 'Mis Solicitudes' : 'Gestión de Reservas'}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {canViewRecommendations && !canApprove
                ? 'Administra tus solicitudes de reserva de espacios'
                : 'Administra todas las reservas y solicitudes del sistema'}
            </p>
          </div>
          <PermissionGuard requiredPermissions={['reserva:crear']}>
            <Button onClick={() => setIsFormDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">
                {canViewRecommendations && !canApprove ? 'Nueva Solicitud' : 'Nueva Reserva'}
              </span>
              <span className="sm:hidden">{canViewRecommendations && !canApprove ? 'Solicitar' : 'Nueva'}</span>
            </Button>
          </PermissionGuard>
        </div>

        {/* Estadísticas arriba (horizontal) */}
        <PermissionGuard requiredPermission="estadisticas:ver" fallback={null} showFallback={false}>
          <div className="w-full">
            <ReservationStats 
              onRefresh={viewMode === 'calendar' ? fetchReservas : fetchReservasPaged}
              collapsed={false}
              onCollapsedChange={() => {}}
              horizontal={true}
            />
          </div>
        </PermissionGuard>
      </div>

      {/* Layout principal: Calendario/Gestión + Pendientes */}
      <div className="flex gap-4 sm:gap-6 flex-col lg:flex-row lg:items-stretch flex-1 min-h-0 mt-4 sm:mt-6">
        {/* Gestión de reservas (calendario/cards/table) */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Lista unificada de reservas */}
          {viewMode === 'cards' && (
            <div className="flex-1 flex flex-col min-h-0">
              {renderCardView(reservasFiltradas)}
            </div>
          )}
          {viewMode === 'table' && (
            <div className="flex-1 flex flex-col min-h-0">
              {renderTableView(reservasFiltradas)}
            </div>
          )}
          {viewMode === 'calendar' && (
            <div className="flex-1 flex flex-col min-h-0">
              {renderCalendarView(reservasFiltradas)}
            </div>
          )}
        </div>

        {/* Lateral derecho: Pendientes (misma altura que el contenido principal) */}
        <div className="w-full lg:w-auto lg:shrink-0 lg:order-last flex flex-col min-h-0">
          <PermissionGuard requiredPermission="reserva:aprobar" fallback={null} showFallback={false}>
            {canApprove && (
              <ReservationPendientes
                reservasPendientes={reservasPendientes}
                loading={pendientesLoading}
                onViewDetails={handleViewDetails}
                collapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
              />
            )}
          </PermissionGuard>
        </div>
      </div>

      {/* Modal de formulario de reserva */}
      <PermissionGuard requiredPermissions={['reserva:crear']}>
        <ReservationFormDialog
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          onSuccess={() => {
            // Recargar reservas después de crear exitosamente
            if (viewMode === 'calendar') {
              fetchReservas();
            } else {
              fetchReservasPaged();
            }
            if (canApprove) {
              fetchReservasPendientes();
            }
            setIsFormDialogOpen(false);
          }}
        />
      </PermissionGuard>

      {/* Modales */}
      {selectedReserva && (
        <ReservationDetailsDialog
          reserva={selectedReserva}
          open={detailsDialog}
          onOpenChange={(open) => {
            setDetailsDialog(open);
            if (!open) {
              setSelectedReserva(null);
            }
          }}
          onReservaUpdated={() => {
            // Recargar datos cuando se aprueba/rechaza una reserva
            if (viewMode === 'calendar') {
              fetchReservas();
            } else {
              fetchReservasPaged();
            }
            if (canApprove) {
              fetchReservasPendientes();
            }
          }}
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
