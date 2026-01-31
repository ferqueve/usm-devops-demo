import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import { espaciosApi } from '@/lib/api/spaces';
import { useAuth } from '@/hooks/useAuth';
import { useEspacios } from '@/hooks/useEspacios';
import { useCarreras } from '@/hooks/useCarreras';
import { ROLES } from '@/lib/config/constants';
import type { Reserva, TipoEspacio } from '@/lib/types/spaces';
import ReservationCalendarView from '@/components/reservations/ReservationCalendarView';
import ReservationDetailsDialog from '@/components/reservations/ReservationDetailsDialog';
import ReservationFormDialog from '@/components/reservations/ReservationFormDialog';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

interface EspacioOption {
  id: number;
  nombre: string;
}

interface CarreraOption {
  id: number;
  nombre: string;
  codigo?: string;
}

interface TipoEspacioOption {
  id: number;
  nombre: string;
  color?: string;
}

// Vista de Calendario de Reservas Público
export default function Calendar() {
  const { user } = useAuth();
  const isExterno = user?.rol === ROLES.EXTERNO;
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const { espacios } = useEspacios();
  const { carreras } = useCarreras();
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros simplificados para visualización
  // En el calendario público solo se muestran reservas confirmadas (APROBADO)
  const estadoFilter = 'APROBADO'; // Fijo: solo confirmadas
  const [espacioFilter, setEspacioFilter] = useState<number | null>(null);
  const [carreraFilter, setCarreraFilter] = useState<number | null>(null);
  const [tipoEspacioFilter, setTipoEspacioFilter] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Diálogo de detalles
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  
  // Diálogo de creación de reserva (para externos)
  const [createReservaDialog, setCreateReservaDialog] = useState(false);

  // Cargar tipos de espacio para los filtros
  useEffect(() => {
    const fetchTiposEspacio = async () => {
      try {
        const tiposEspacioRes = await espaciosApi.listarTiposEspacio();
        if (tiposEspacioRes.data) setTiposEspacio(tiposEspacioRes.data);
      } catch (error: unknown) {
        console.error('Error al cargar tipos de espacio:', error instanceof Error ? error.message : error);
      }
    };
    fetchTiposEspacio();
  }, []);

  // Cargar reservas
  const fetchReservas = useCallback(async () => {
    setLoading(true);
    try {
      // En el calendario público, TODOS los roles ven TODAS las reservas aprobadas
      const response = await reservationsApi.obtenerTodasLasReservas(
        'APROBADO', // Solo confirmadas
        espacioFilter,
        carreraFilter,
        tipoEspacioFilter,
        fechaInicio,
        fechaFin
      );

      if (response.data) {
        let reservasFiltradas = response.data;

        // Filtrar solo reservas confirmadas (APROBADO) - redundante pero por seguridad
        reservasFiltradas = reservasFiltradas.filter(r => r.estado === 'APROBADO');

        // EXTERNO solo puede ver reservas públicas (esPublica === true)
        if (isExterno) {
          reservasFiltradas = reservasFiltradas.filter(r => r.esPublica === true);
        }

        setReservas(reservasFiltradas);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las reservas';
      toast.error('Error al cargar reservas', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [isExterno, espacioFilter, carreraFilter, tipoEspacioFilter, fechaInicio, fechaFin]);

  // Cargar reservas cuando cambian los filtros o el rol
  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  const handleViewDetails = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setDetailsDialog(true);
  };

  const handleClearFilters = () => {
    setEspacioFilter(null);
    setCarreraFilter(null);
    setTipoEspacioFilter(null);
    setFechaInicio(undefined);
    setFechaFin(undefined);
  };

  // Verificar si hay filtros activos (sin incluir estado, que siempre es APROBADO)
  const hayFiltrosActivos = 
    espacioFilter !== null || 
    carreraFilter !== null ||
    tipoEspacioFilter !== null ||
    fechaInicio !== undefined || 
    fechaFin !== undefined;

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleCreateReserva = () => {
    setCreateReservaDialog(true);
  };

  const handleReservaCreated = () => {
    setCreateReservaDialog(false);
    // Recargar reservas después de crear una
    fetchReservas();
  };

  // Obtener opciones para los filtros
  const espaciosUnicos: EspacioOption[] = espacios.map(e => ({ id: e.id, nombre: e.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  const carrerasUnicas: CarreraOption[] = carreras
    .filter(c => !c.deletedAt) // Filtrar carreras eliminadas
    .map(c => ({ id: c.id, nombre: c.nombre, codigo: c.codigo }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  const tiposEspacioUnicos: TipoEspacioOption[] = tiposEspacio
    .map(t => ({ id: t.id, nombre: t.nombre, color: t.color }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Reservas filtradas (ya vienen filtradas del servidor, pero mantenemos la estructura)
  const reservasFiltradas = reservas;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Calendario de Reservas</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isExterno ? 'Visualiza las reservas públicas del sistema' : 'Visualiza todas las reservas del sistema'}
          </p>
        </div>
        {isExterno && (
          <Button onClick={handleCreateReserva} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Solicitar Reserva
          </Button>
        )}
      </div>

      {/* Vista de calendario */}
      <ReservationCalendarView
        reservas={reservasFiltradas}
        espaciosUnicos={espaciosUnicos}
        carrerasUnicas={carrerasUnicas}
        tiposEspacioUnicos={tiposEspacioUnicos}
        tiempoFilter="todas"
        estadoFilter={estadoFilter}
        espacioFilter={espacioFilter}
        carreraFilter={carreraFilter}
        tipoEspacioFilter={tipoEspacioFilter}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        viewMode="calendar"
        hayFiltrosActivos={hayFiltrosActivos}
        showPendienteFilter={false} // No mostrar filtro de pendientes en calendario público
        hideEstadoFilter={true} // Ocultar completamente el filtro de estado (siempre APROBADO)
        onTiempoFilterChange={() => {}} // No usado en vista pública
        onEstadoFilterChange={() => {}} // No permitir cambiar estado (siempre APROBADO)
        onEspacioFilterChange={setEspacioFilter}
        onCarreraFilterChange={setCarreraFilter}
        onTipoEspacioFilterChange={setTipoEspacioFilter}
        onFechaInicioChange={setFechaInicio}
        onFechaFinChange={setFechaFin}
        onViewModeChange={() => {}} // Solo calendario
        onClearFilters={handleClearFilters}
        onViewDetails={handleViewDetails}
        onCancelReserva={() => {}} // No permitido en vista pública
        loading={loading}
        readOnly={!isExterno}
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
      />

      {/* Diálogo de detalles */}
      {selectedReserva && (
        <ReservationDetailsDialog
          reserva={selectedReserva}
          open={detailsDialog}
          onOpenChange={setDetailsDialog}
        />
      )}

      {/* Diálogo de creación de reserva (para externos) */}
      {isExterno && (
        <ReservationFormDialog
          open={createReservaDialog}
          onOpenChange={setCreateReservaDialog}
          onSuccess={handleReservaCreated}
        />
      )}
    </div>
  );
}
