import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import { espaciosApi } from '@/lib/api/spaces';
import { carrerasApi } from '@/lib/api/carreras';
import type { Reserva } from '@/lib/types/spaces';
import type { Espacio } from '@/lib/types/spaces';
import type { Carrera } from '@/lib/types/spaces';
import type { TipoEspacio } from '@/lib/types/spaces';
import ReservationCalendarView from '@/components/reservations/ReservationCalendarView';
import ReservationDetailsDialog from '@/components/reservations/ReservationDetailsDialog';

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
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros simplificados para visualización
  const [estadoFilter, setEstadoFilter] = useState<string>('todas');
  const [espacioFilter, setEspacioFilter] = useState<number | null>(null);
  const [carreraFilter, setCarreraFilter] = useState<number | null>(null);
  const [tipoEspacioFilter, setTipoEspacioFilter] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Diálogo de detalles
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  // Cargar datos para los filtros
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [espaciosRes, carrerasRes, tiposEspacioRes] = await Promise.all([
          espaciosApi.obtenerEspacios(),
          carrerasApi.obtenerCarreras(),
          espaciosApi.listarTiposEspacio()
        ]);
        
        if (espaciosRes.data) setEspacios(espaciosRes.data);
        if (carrerasRes.data) setCarreras(carrerasRes.data);
        if (tiposEspacioRes.data) setTiposEspacio(tiposEspacioRes.data);
      } catch (error: any) {
        console.error('Error al cargar datos:', error);
      }
    };
    fetchData();
  }, []);

  // Cargar reservas
  const fetchReservas = async () => {
    setLoading(true);
    try {
      const response = await reservationsApi.obtenerTodasLasReservas(
        estadoFilter !== 'todas' ? estadoFilter : undefined,
        espacioFilter,
        carreraFilter,
        tipoEspacioFilter,
        fechaInicio,
        fechaFin
      );
      if (response.data) {
        setReservas(response.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar reservas', {
        description: error.message || 'No se pudieron cargar las reservas'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar reservas cuando cambian los filtros
  useEffect(() => {
    fetchReservas();
  }, [estadoFilter, espacioFilter, carreraFilter, tipoEspacioFilter, fechaInicio, fechaFin]);

  const handleViewDetails = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setDetailsDialog(true);
  };

  const handleClearFilters = () => {
    setEstadoFilter('todas');
    setEspacioFilter(null);
    setCarreraFilter(null);
    setTipoEspacioFilter(null);
    setFechaInicio(undefined);
    setFechaFin(undefined);
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = estadoFilter !== 'todas' || 
    espacioFilter !== null || 
    carreraFilter !== null ||
    tipoEspacioFilter !== null ||
    fechaInicio !== undefined || 
    fechaFin !== undefined;

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
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
            Visualiza todas las reservas del sistema
          </p>
        </div>
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
        onTiempoFilterChange={() => {}} // No usado en vista pública
        onEstadoFilterChange={setEstadoFilter}
        onEspacioFilterChange={setEspacioFilter}
        onCarreraFilterChange={setCarreraFilter}
        onTipoEspacioFilterChange={setTipoEspacioFilter}
        onFechaInicioChange={setFechaInicio}
        onFechaFinChange={setFechaFin}
        onViewModeChange={() => {}} // Solo calendario
        onClearFilters={handleClearFilters}
        onCreateReserva={() => {}} // No permitido en vista pública
        onViewDetails={handleViewDetails}
        onCancelReserva={() => {}} // No permitido en vista pública
        loading={loading}
        readOnly={true}
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
    </div>
  );
}
