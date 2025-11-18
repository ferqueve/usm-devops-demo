import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/Button";
import { Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import { espaciosApi } from '@/lib/api/spaces';
import { carrerasApi } from '@/lib/api/carreras';
// import { usuariosApi } from '@/lib/api/users'; // Se usará cuando se agregue el filtro de usuario
import type { Reserva } from '@/lib/types/spaces';
import type { Espacio } from '@/lib/types/spaces';
import type { Carrera } from '@/lib/types/spaces';
import type { TipoEspacio } from '@/lib/types/spaces';
// import type { User } from '@/lib/types/users'; // Se usará cuando se agregue el filtro de usuario
import ReservationFormDialog from './ReservationFormDialog.tsx';
import ReservationDetailsDialog from './ReservationDetailsDialog.tsx';
import ReservationStats from './ReservationStats.tsx';
import ReservationCardView from './ReservationCardView.tsx';
import ReservationTableView from './ReservationTableView.tsx';
import ReservationCalendarView from './ReservationCalendarView.tsx';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();
  const isDocente = user?.rol === 'DOCENTE';
  const isAnalista = user?.rol === 'ANALISTA' || user?.rol === 'ADMIN';
  
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [contentLoading, setContentLoading] = useState(false); // Loading solo para el contenido de table/cards
  const [calendarLoading, setCalendarLoading] = useState(false); // Loading solo para calendar
  const [estadoFilter, setEstadoFilter] = useState<string>('todas');
  const [tiempoFilter, setTiempoFilter] = useState<string>('todas');
  const [espacioFilter, setEspacioFilter] = useState<number | null>(null);
  const [carreraFilter, setCarreraFilter] = useState<number | null>(null);
  const [tipoEspacioFilter, setTipoEspacioFilter] = useState<number | null>(null);
  const [usuarioFilter, setUsuarioFilter] = useState<number | null>(null); // Solo para ANALISTA
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
  
  // Contador de solicitudes pendientes (solo para ANALISTA)
  const [pendientesCount, setPendientesCount] = useState(0);

  const fetchReservas = useCallback(async () => {
    setCalendarLoading(true); // Solo afecta al contenido de calendar
    try {
      let response;
      if (isDocente) {
        // DOCENTE: solo sus reservas
        response = await reservationsApi.obtenerMisReservas();
      } else {
        // ANALISTA: todas las reservas
        response = await reservationsApi.obtenerTodasLasReservas(
          estadoFilter !== 'todas' ? estadoFilter : undefined,
          espacioFilter ?? undefined,
          carreraFilter ?? undefined,
          tipoEspacioFilter ?? undefined,
          fechaInicio ?? undefined,
          fechaFin ?? undefined
        );
      }
      
      if (response.data) {
        // Ordenar por fecha descendente
        const sorted = response.data.sort((a, b) =>
          new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
        );
        setReservas(sorted);
        
        // Contar pendientes para ANALISTA
        if (isAnalista) {
          const pendientes = sorted.filter(r => r.estado === 'PENDIENTE').length;
          setPendientesCount(pendientes);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las reservas';
      toast.error('Error al cargar reservas', {
        description: errorMessage
      });
    } finally {
      setCalendarLoading(false);
    }
  }, [isDocente, isAnalista, estadoFilter, espacioFilter, carreraFilter, tipoEspacioFilter, fechaInicio, fechaFin]);

  const fetchReservasPaged = useCallback(async () => {
    setContentLoading(true); // Solo afecta al contenido
    try {
      let response;
      if (isDocente) {
        // DOCENTE: solo sus reservas
        response = await reservationsApi.obtenerMisReservasPaged(
          page,
          pageSize,
          estadoFilter,
          espacioFilter,
          carreraFilter,
          tipoEspacioFilter,
          fechaInicio,
          fechaFin,
          tiempoFilter
        );
      } else {
        // ANALISTA: todas las reservas
        response = await reservationsApi.obtenerTodasReservasPaged(
          page,
          pageSize,
          estadoFilter,
          espacioFilter,
          carreraFilter,
          tipoEspacioFilter,
          usuarioFilter,
          fechaInicio,
          fechaFin,
          tiempoFilter
        );
      }
      
      if (response.data) {
        setReservas(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
        
        // Contar pendientes para ANALISTA
        if (isAnalista && page === 0) {
          // Intentar obtener el total de pendientes desde el servidor
          try {
            const pendientesResponse = await reservationsApi.obtenerTodasReservasPaged(
              0,
              1000, // Obtener muchas para contar
              'PENDIENTE',
              null,
              null,
              null,
              null,
              null,
              null,
              undefined
            );
            if (pendientesResponse.data) {
              setPendientesCount(pendientesResponse.data.totalElements);
            }
          } catch {
            // Si falla, contar solo las visibles
            const pendientesVisibles = response.data.content.filter(r => r.estado === 'PENDIENTE').length;
            setPendientesCount(pendientesVisibles);
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las reservas';
      toast.error('Error al cargar reservas', {
        description: errorMessage
      });
    } finally {
      setContentLoading(false);
    }
  }, [isDocente, isAnalista, page, pageSize, estadoFilter, espacioFilter, carreraFilter, tipoEspacioFilter, usuarioFilter, fechaInicio, fechaFin, tiempoFilter]);

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

  // Estados para carreras, tipos de espacio, espacios y usuarios
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  // const [usuarios, setUsuarios] = useState<User[]>([]); // Solo para ANALISTA - se usará cuando se agregue el filtro de usuario

  // Cargar carreras, tipos de espacio, espacios y usuarios para los filtros
  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises: Promise<unknown>[] = [
          carrerasApi.obtenerCarreras(),
          espaciosApi.listarTiposEspacio(),
          espaciosApi.obtenerEspacios()
        ];
        
        // Cargar usuarios para filtro (se implementará cuando se agregue el filtro de usuario a las vistas)
        // if (isAnalista) {
        //   promises.push(usuariosApi.listarUsuarios(0, 1000, {}));
        // }
        
        const results = await Promise.all(promises);
        
        const carrerasRes = results[0] as { data?: Carrera[] };
        if (carrerasRes?.data) {
          setCarreras(carrerasRes.data);
        }
        const tiposEspacioRes = results[1] as { data?: TipoEspacio[] };
        if (tiposEspacioRes?.data) {
          setTiposEspacio(tiposEspacioRes.data);
        }
        const espaciosRes = results[2] as { data?: Espacio[] };
        if (espaciosRes?.data) {
          setEspacios(espaciosRes.data);
        }
        // Cargar usuarios para filtro (se implementará cuando se agregue el filtro de usuario a las vistas)
        // if (isAnalista && results[3]) {
        //   const usuariosRes = results[3] as { data?: { content: User[] } };
        //   if (usuariosRes?.data && 'content' in usuariosRes.data) {
        //     setUsuarios(usuariosRes.data.content);
        //   }
        // }
      } catch (error: unknown) {
        console.error('Error al cargar datos para filtros:', error);
      }
    };
    fetchData();
  }, [isAnalista]);

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


  // Obtener título dinámico según filtros y rol
  const getTituloReservas = () => {
    if (isDocente) {
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
        onTiempoFilterChange={(filter) => { setTiempoFilter(filter); setPage(0); }}
        onEstadoFilterChange={(filter) => { setEstadoFilter(filter); setPage(0); }}
        onEspacioFilterChange={(filter) => { setEspacioFilter(filter); setPage(0); }}
        onCarreraFilterChange={(filter) => { setCarreraFilter(filter); setPage(0); }}
        onTipoEspacioFilterChange={(filter) => { setTipoEspacioFilter(filter); setPage(0); }}
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
        onTiempoFilterChange={(filter) => { setTiempoFilter(filter); setPage(0); }}
        onEstadoFilterChange={(filter) => { setEstadoFilter(filter); setPage(0); }}
        onEspacioFilterChange={(filter) => { setEspacioFilter(filter); setPage(0); }}
        onCarreraFilterChange={(filter) => { setCarreraFilter(filter); setPage(0); }}
        onTipoEspacioFilterChange={(filter) => { setTipoEspacioFilter(filter); setPage(0); }}
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
        onTiempoFilterChange={setTiempoFilter}
        onEstadoFilterChange={setEstadoFilter}
        onEspacioFilterChange={setEspacioFilter}
        onCarreraFilterChange={setCarreraFilter}
        onTipoEspacioFilterChange={setTipoEspacioFilter}
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
          <h2 className="text-xl sm:text-2xl font-bold">
            {isDocente ? 'Mis Solicitudes' : 'Gestión de Reservas'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isDocente 
              ? 'Administra tus solicitudes de reserva de espacios'
              : 'Administra todas las reservas y solicitudes del sistema'}
          </p>
        </div>
        <PermissionGuard requiredPermissions={['reservas:crear', 'reservas:solicitar']}>
          <Button onClick={() => setCreateDialog(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              {isDocente ? 'Nueva Solicitud' : 'Nueva Reserva'}
            </span>
            <span className="sm:hidden">{isDocente ? 'Solicitar' : 'Nueva'}</span>
          </Button>
        </PermissionGuard>
      </div>

      {/* Sección de Solicitudes Pendientes para ANALISTA */}
      {isAnalista && pendientesCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">
                {pendientesCount} {pendientesCount === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
              </p>
              <p className="text-sm text-amber-700">
                Hay solicitudes de reserva esperando aprobación
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEstadoFilter('PENDIENTE');
              setPage(0);
            }}
            className="border-amber-300 text-amber-900 hover:bg-amber-100"
          >
            Ver Pendientes
          </Button>
        </div>
      )}

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
          <PermissionGuard requiredPermission="estadisticas:ver" fallback={null} showFallback={false}>
            <ReservationStats onRefresh={viewMode === 'calendar' ? fetchReservas : fetchReservasPaged} />
          </PermissionGuard>
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
