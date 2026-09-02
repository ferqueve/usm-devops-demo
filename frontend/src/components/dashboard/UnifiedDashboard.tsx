import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { dashboardApi, type DashboardData } from '@/lib/api/dashboard';
import { espaciosApi } from '@/lib/api/spaces';
import { inventarioApi } from '@/lib/api/inventory';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import { reservationsApi } from '@/lib/api/reservations';
import type { Reserva, InventoryStats as InventoryStatsType } from '@/lib/types/spaces';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/config/constants';

import ReservationDetailsDialog from '@/components/reservations/ReservationDetailsDialog';
import { AdminDashboard } from './views/AdminDashboard';
import { AnalistaDashboard } from './views/AnalistaDashboard';
import { DocenteDashboard } from './views/DocenteDashboard';
import { MantenimientoDashboard } from './views/MantenimientoDashboard';
import { EstudianteDashboard } from './views/EstudianteDashboard';
import { ExternoDashboard } from './views/ExternoDashboard';

interface EspaciosStats {
  totalEspacios: number;
  disponibles: number;
  enMantenimiento: number;
  ocupados: number;
}

interface DashboardPermissions {
  canApproveReservations: boolean;
  canViewRecommendations: boolean;
  canManageInventory: boolean;
  canCreateReservations: boolean;
  canViewReservationStats: boolean;
  /** Rol del usuario: ADMIN se resuelve por rol, no por permiso. */
  rol?: string;
}

async function loadDashboardForRole(perms: DashboardPermissions): Promise<DashboardData | null> {
  // ADMIN va primero y por rol: comparte permisos con ANALISTA (aprueba reservas),
  // así que caía en su branch y veía el dataset del analista — entre otras cosas
  // sin usuarios activos, por eso ese contador quedaba siempre en 0.
  if (perms.rol === ROLES.ADMIN) {
    return dashboardApi.obtenerDatosDashboardAdmin();
  }
  if (perms.canApproveReservations) {
    return dashboardApi.obtenerDatosDashboardAnalista();
  }
  if (perms.canViewRecommendations) {
    return dashboardApi.obtenerDatosDashboardDocente();
  }
  if (perms.canManageInventory) {
    return dashboardApi.obtenerDatosDashboardMantenimiento();
  }
  if (perms.canCreateReservations) {
    return dashboardApi.obtenerDatosDashboardExterno();
  }
  return dashboardApi.obtenerDatosDashboardEstudiante();
}

async function loadReservasForRole(canApprove: boolean): Promise<Reserva[]> {
  try {
    if (canApprove) {
      const response = await reservationsApi.obtenerTodasReservasPaged({
        estado: 'PENDIENTE',
        page: 0,
        size: 30,
      });
      return response.data?.content ?? [];
    }
    const response = await reservationsApi.obtenerMisReservas();
    return response.data ?? [];
  } catch (error) {
    console.warn('No se pudieron cargar reservas:', error);
    return [];
  }
}

interface MaintenanceStats {
  inventario: InventoryStatsType | null;
  espacios: EspaciosStats | null;
  pendingRequests: number;
}

async function loadMaintenanceStats(): Promise<MaintenanceStats> {
  try {
    const [inventarioRes, espaciosRes, pendingReqs] = await Promise.all([
      inventarioApi.obtenerEstadisticasInventario(),
      espaciosApi.obtenerEstadisticasEspacios(),
      inventarioApi.obtenerSolicitudesPendientes(),
    ]);
    return {
      inventario: inventarioRes.data ?? null,
      espacios: (espaciosRes.data ?? null) as EspaciosStats | null,
      pendingRequests: pendingReqs.data?.length ?? 0,
    };
  } catch (error) {
    console.warn('No se pudieron cargar estadísticas de mantenimiento:', error);
    return { inventario: null, espacios: null, pendingRequests: 0 };
  }
}

async function loadReservasPrioritarias(): Promise<RecomendacionAnalista[]> {
  try {
    const prioritarias = await recomendacionesApi.obtenerReservasPrioritarias();
    if (prioritarias.success && prioritarias.data) return prioritarias.data;
    return [];
  } catch (error) {
    console.warn('No se pudieron cargar reservas prioritarias:', error);
    return [];
  }
}

export default function UnifiedDashboard() {
  const { hasPermission } = useRolePermissions();
  const { user } = useAuth();

  const canViewReservationStats = hasPermission('estadisticas:ver');
  const canApproveReservations = hasPermission('reserva:aprobar');
  const canManageInventory = hasPermission('inventario:editar');
  const canViewRecommendations = hasPermission('recomendacion:ver');
  const canCreateReservations = hasPermission('reserva:crear');

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  const [allReservas, setAllReservas] = useState<Reserva[]>([]);
  const [reservasPendientes, setReservasPendientes] = useState<Reserva[]>([]);
  const [reservasPrioritarias, setReservasPrioritarias] = useState<RecomendacionAnalista[]>([]);
  const [loadingPrioritarias, setLoadingPrioritarias] = useState(false);

  const [inventarioStats, setInventarioStats] = useState<InventoryStatsType | null>(null);
  const [espaciosStats, setEspaciosStats] = useState<EspaciosStats | null>(null);
  const [pendingInventoryRequests, setPendingInventoryRequests] = useState(0);

  useEffect(() => {
    const perms: DashboardPermissions = {
      rol: user?.rol,
      canApproveReservations,
      canViewRecommendations,
      canManageInventory,
      canCreateReservations,
      canViewReservationStats,
    };

    const shouldLoadReservas =
      canViewReservationStats || canCreateReservations || canViewRecommendations;
    const needsMantenimiento = canManageInventory;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashboardData, reservas, mantenimiento] = await Promise.all([
          loadDashboardForRole(perms),
          shouldLoadReservas ? loadReservasForRole(canApproveReservations) : Promise.resolve(null),
          needsMantenimiento ? loadMaintenanceStats() : Promise.resolve(null),
        ]);

        setData(dashboardData);
        if (reservas) {
          setAllReservas(reservas);
          setReservasPendientes(reservas.filter((r) => r.estado === 'PENDIENTE'));
        }
        if (mantenimiento) {
          setInventarioStats(mantenimiento.inventario);
          setEspaciosStats(mantenimiento.espacios);
          setPendingInventoryRequests(mantenimiento.pendingRequests);
        }

        if (canApproveReservations) {
          setLoadingPrioritarias(true);
          loadReservasPrioritarias()
            .then((p) => setReservasPrioritarias(p))
            .finally(() => setLoadingPrioritarias(false));
        }
      } catch (error: unknown) {
        console.error('Error al cargar datos del dashboard:', error);
        const msg = error instanceof Error ? error.message : 'No se pudieron cargar los datos';
        toast.error('Error al cargar el dashboard', { description: msg });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [canApproveReservations, canViewRecommendations, canManageInventory, canCreateReservations, canViewReservationStats]);

  const handleViewDetails = (r: Reserva) => {
    setSelectedReserva(r);
    setDetailsDialog(true);
  };

  // Selección de vista por rol. Roles compuestos (ADMIN ≈ ANALISTA + MANTENIMIENTO)
  // priorizan el flujo más representativo: ADMIN ve el panel de operaciones.
  const renderView = () => {
    const rol = user?.rol;

    if (rol === ROLES.ADMIN) {
      return (
        <AdminDashboard
          data={data}
          loading={loading}
          reservasPrioritarias={reservasPrioritarias}
          reservasPendientes={reservasPendientes}
          loadingPrioritarias={loadingPrioritarias}
          pendingInventoryRequests={pendingInventoryRequests}
          onViewDetails={handleViewDetails}
        />
      );
    }
    if (rol === ROLES.ANALISTA) {
      return (
        <AnalistaDashboard
          data={data}
          loading={loading}
          reservasPrioritarias={reservasPrioritarias}
          reservasPendientes={reservasPendientes}
          loadingPrioritarias={loadingPrioritarias}
          onViewDetails={handleViewDetails}
        />
      );
    }
    if (rol === ROLES.MANTENIMIENTO) {
      return (
        <MantenimientoDashboard
          loading={loading}
          inventarioStats={inventarioStats}
          espaciosStats={espaciosStats}
          pendingInventoryRequests={pendingInventoryRequests}
        />
      );
    }
    if (rol === ROLES.DOCENTE) {
      return (
        <DocenteDashboard
          data={data}
          loading={loading}
          misReservas={allReservas}
          onViewDetails={handleViewDetails}
        />
      );
    }
    if (rol === ROLES.EXTERNO) {
      return (
        <ExternoDashboard
          data={data}
          loading={loading}
          misReservas={allReservas}
          onViewDetails={handleViewDetails}
        />
      );
    }
    return (
      <EstudianteDashboard data={data} loading={loading} onViewDetails={handleViewDetails} />
    );
  };

  return (
    <div className="space-y-5">
      {renderView()}

      {selectedReserva && (
        <ReservationDetailsDialog
          reserva={selectedReserva}
          open={detailsDialog}
          onOpenChange={setDetailsDialog}
          onReservaUpdated={() => {
            globalThis.location.reload();
          }}
        />
      )}
    </div>
  );
}
