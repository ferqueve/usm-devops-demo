import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/Button";
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import { espaciosApi } from '@/lib/api/spaces';
import { useEspacios } from '@/hooks/useEspacios';
import { useCarreras } from '@/hooks/useCarreras';
// import { usuariosApi } from '@/lib/api/users'; // Se usará cuando se agregue el filtro de usuario
import type { Reserva, TipoEspacio } from '@/lib/types/spaces';
// import type { User } from '@/lib/types/users'; // Se usará cuando se agregue el filtro de usuario
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
    setCalendarLoading(true); // Solo afecta al contenido de calendar
    try {
      let response;
      if (showPendienteFilter) {
        // DOCENTE/EXTERNO: solo sus reservas
        response = await reservationsApi.obtenerMisReservas();
        
        if (response.data) {
          // Si el filtro es PENDIENTE, mostrar solo pendientes
          if (estadoFilter === 'PENDIENTE') {
            response.data = response.data.filter((r: Reserva) => r.estado === 'PENDIENTE');
          } else if (estadoFilter !== 'todas') {
            // Si el filtro es un estado específico, mostrar solo ese estado
            response.data = response.data.filter((r: Reserva) => r.estado === estadoFilter);
          }
          // Si el filtro es 'todas', no filtrar por estado (mostrar todas incluyendo pendientes)
        }
      } else {
        // ANALISTA/ADMIN: solo sus reservas + las asignadas a ellos
        const estadoParaFiltrar = estadoFilter !== 'todas' && estadoFilter !== 'PENDIENTE'
          ? estadoFilter
          : undefined;
        response = await reservationsApi.obtenerTodasLasReservas(
          estadoParaFiltrar,
          espacioFilter ?? undefined,
          carreraFilter ?? undefined,
          tipoEspacioFilter ?? undefined,
          fechaInicio ?? undefined,
          fechaFin ?? undefined
        );

        if (response.data && user?.id) {
          // Filtrar para mostrar solo:
          // 1. Reservas creadas por el usuario (usuarioId === user.id)
          // 2. Reservas asignadas al analista (analistaId === user.id)
          response.data = response.data.filter((reserva: Reserva) => {
            const esPropia = reserva.usuarioId === user.id;
            const esAsignada = reserva.analistaId === user.id;
            const noEsPendiente = reserva.estado !== 'PENDIENTE'; // Excluir pendientes (se muestran en sidebar)

            return (esPropia || esAsignada) && noEsPendiente;
          });
        }
      }
      
      if (response.data) {
        // Ordenar por fecha descendente
        const sorted = response.data.sort((a, b) =>
          new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
        );
        setReservas(sorted);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las reservas';
      toast.error('Error al cargar reservas', {
        description: errorMessage
      });
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
        let pendientesFiltradas = response.data.filter((reserva: Reserva) =>
          reserva.analistaId === user.id
        );

        // Ordenar por fecha de creación descendente (más recientes primero)
        const sorted = pendientesFiltradas.sort((a, b) =>
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
    setContentLoading(true); // Solo afecta al contenido
    try {
      let response;
      if (showPendienteFilter) {
        // DOCENTE/EXTERNO: solo sus reservas
        // Si el filtro es PENDIENTE, mostrar pendientes; si no, excluirlas
        const estadoParaFiltrar = estadoFilter === 'PENDIENTE' 
          ? 'PENDIENTE' 
          : (estadoFilter === 'todas' ? undefined : estadoFilter);
        response = await reservationsApi.obtenerMisReservasPaged(
          page,
          pageSize,
          estadoParaFiltrar,
          espacioFilter,
          carreraFilter,
          tipoEspacioFilter,
          fechaInicio,
          fechaFin,
          tiempoFilter
        );
        
        if (response.data) {
          // Si el filtro es PENDIENTE, mostrar solo pendientes
          if (estadoFilter === 'PENDIENTE') {
            response.data.content = response.data.content.filter((r: Reserva) => r.estado === 'PENDIENTE');
          } else if (estadoFilter !== 'todas') {
            // Si el filtro es un estado específico, mostrar solo ese estado
            response.data.content = response.data.content.filter((r: Reserva) => r.estado === estadoFilter);
          }
          // Si el filtro es 'todas', no filtrar por estado (mostrar todas incluyendo pendientes)
        }
      } else {
        // ANALISTA/ADMIN: solo sus reservas + las asignadas a ellos
        const estadoParaFiltrar = estadoFilter !== 'todas' && estadoFilter !== 'PENDIENTE'
          ? estadoFilter
          : undefined;
        response = await reservationsApi.obtenerTodasReservasPaged(
          page,
          pageSize,
          estadoParaFiltrar,
          espacioFilter,
          carreraFilter,
          tipoEspacioFilter,
          usuarioFilter,
          fechaInicio,
          fechaFin,
          tiempoFilter
        );

        if (response.data && user?.id) {
          // Filtrar para mostrar solo:
          // 1. Reservas creadas por el usuario (usuarioId === user.id)
          // 2. Reservas asignadas al analista (analistaId === user.id)
          response.data.content = response.data.content.filter((reserva: Reserva) => {
            const esPropia = reserva.usuarioId === user.id;
            const esAsignada = reserva.analistaId === user.id;
            const noEsPendiente = reserva.estado !== 'PENDIENTE'; // Excluir pendientes (se muestran en sidebar)

            return (esPropia || esAsignada) && noEsPendiente;
          });
        }
      }
      
      if (response.data) {
        setReservas(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las reservas';
      toast.error('Error al cargar reservas', {
        description: errorMessage
      });
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
  // const [usuarios, setUsuarios] = useState<User[]>([]); // Solo para ANALISTA - se usará cuando se agregue el filtro de usuario

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
  const reservasFiltradas = viewMode === 'calendar' 
    ? reservas.filter((reserva: Reserva) => {
        // Filtro por estado
        if (estadoFilter !== 'todas' && reserva.estado !== estadoFilter) {
          return false;
        }
        
        // Para analistas/admin, excluir PENDIENTE siempre (se muestran en sidebar)
        // Para docentes/externos, permitir PENDIENTE cuando el filtro es 'PENDIENTE' o 'todas'
        if (reserva.estado === 'PENDIENTE') {
          if (!showPendienteFilter) {
            // Analistas/admin: nunca mostrar pendientes en el calendario
            return false;
          }
          // Docentes/externos: mostrar pendientes cuando el filtro es 'PENDIENTE' o 'todas'
          // (ya se filtró por estado arriba, así que si llegamos aquí y showPendienteFilter es true, se muestra)
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
        // Filtro por tipo de espacio
        if (tipoEspacioFilter !== null && reserva.tipoEspacioId !== tipoEspacioFilter) {
          return false;
        }
        // Filtro por carrera
        if (carreraFilter !== null && reserva.carreraId !== carreraFilter) {
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


  // Obtener título dinámico según filtros y permisos
  const getTituloReservas = () => {
    if (canViewRecommendations && !canApprove) {
      // DOCENTE: usa "Solicitudes"
      if (tiempoFilter === 'futuras') return 'Mis Solicitudes Futuras';
      if (tiempoFilter === 'pasadas') return 'Mis Solicitudes Pasadas';
      return 'Mis Solicitudes';
    } else {
      if (tiempoFilter === 'futuras') return 'Reservas Futuras';
      if (tiempoFilter === 'pasadas') return 'Reservas Pasadas';
      return 'Todas las Reservas';
    }
  };

  // Renderizar vista de cards
  const renderCardView = (reservasLista: Reserva[], titulo: string) => {
    return (
      <ReservationCardView
        reservas={reservasLista}
        titulo={titulo}
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
        onTiempoFilterChange={(filter) => { setTiempoFilter(filter); setPage(0); }}
        onEstadoFilterChange={(filter) => { 
          // Permitir filtrar por PENDIENTE solo para docentes/externos
          if (filter === 'PENDIENTE' && !showPendienteFilter) {
            setEstadoFilter('todas');
          } else {
            setEstadoFilter(filter);
          }
          setPage(0);
        }}
        onEspacioFilterChange={(filter) => { setEspacioFilter(filter); setPage(0); }}
        onCarreraFilterChange={(filter) => { setCarreraFilter(filter); setPage(0); }}
        onTipoEspacioFilterChange={(filter) => { setTipoEspacioFilter(filter); setPage(0); }}
        onFechaInicioChange={(date) => { setFechaInicio(date); setPage(0); }}
        onFechaFinChange={(date) => { setFechaFin(date); setPage(0); }}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
        onCreateReserva={() => setIsFormDialogOpen(true)}
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
        onTiempoFilterChange={(filter) => { setTiempoFilter(filter); setPage(0); }}
        onEstadoFilterChange={(filter) => { 
          // Permitir filtrar por PENDIENTE solo para docentes/externos
          if (filter === 'PENDIENTE' && !showPendienteFilter) {
            setEstadoFilter('todas');
          } else {
            setEstadoFilter(filter);
          }
          setPage(0);
        }}
        onEspacioFilterChange={(filter) => { setEspacioFilter(filter); setPage(0); }}
        onCarreraFilterChange={(filter) => { setCarreraFilter(filter); setPage(0); }}
        onTipoEspacioFilterChange={(filter) => { setTipoEspacioFilter(filter); setPage(0); }}
        onFechaInicioChange={(date) => { setFechaInicio(date); setPage(0); }}
        onFechaFinChange={(date) => { setFechaFin(date); setPage(0); }}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
        onCreateReserva={() => setIsFormDialogOpen(true)}
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
        <div className={`flex-1 flex flex-col min-h-0 ${viewMode !== 'calendar' ? '' : ''}`}>
          {/* Lista unificada de reservas */}
          {viewMode === 'cards' && (
            <div className="flex-1 flex flex-col min-h-0">
              {renderCardView(reservasFiltradas, getTituloReservas())}
            </div>
          )}
          {viewMode === 'table' && (
            <div className="flex-1 flex flex-col min-h-0">
              {renderTableView(reservasFiltradas, getTituloReservas())}
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
