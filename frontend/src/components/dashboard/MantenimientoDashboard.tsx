import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi, type DashboardData } from '@/lib/api/dashboard';
import { espaciosApi } from '@/lib/api/spaces';
import { reservationsApi } from '@/lib/api/reservations';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Package, Building2, Wrench, CheckCircle2 } from 'lucide-react';
import type { ReservaItemSolicitado, InventoryStats, Espacio } from '@/lib/types/spaces';

interface EspaciosStats {
  total: number;
  disponibles: number;
  enMantenimiento: number;
}

export default function MantenimientoDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<ReservaItemSolicitado[]>([]);
  const [inventarioStats, setInventarioStats] = useState<InventoryStats | null>(null);
  const [espaciosStats, setEspaciosStats] = useState<EspaciosStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboardData = await dashboardApi.obtenerDatosDashboardMantenimiento();
        setData(dashboardData);
        
        // Cargar solicitudes de inventario pendientes
        try {
          const solicitudes = await reservationsApi.listarSolicitudesInventario({
            estados: ['PENDIENTE'],
            page: 0,
            size: 5
          });
          if (solicitudes.data?.content) {
            setSolicitudesPendientes(solicitudes.data.content);
          }
        } catch (error) {
          console.warn('No se pudieron cargar solicitudes de inventario:', error);
        }

        // Cargar estadísticas de inventario
        try {
          const stats = await espaciosApi.obtenerEstadisticasInventario();
          if (stats.data) {
            setInventarioStats(stats.data);
          }
        } catch (error) {
          console.warn('No se pudieron cargar estadísticas de inventario:', error);
        }

        // Cargar estadísticas de espacios
        try {
          const stats = await espaciosApi.obtenerEspacios();
          if (stats.data) {
            const espacios = stats.data as Espacio[];
            const disponibles = espacios.filter((e: Espacio) => e.activo && e.estado === 'DISPONIBLE').length;
            const enMantenimiento = espacios.filter((e: Espacio) => e.estado === 'MANTENIMIENTO').length;
            setEspaciosStats({
              total: espacios.length,
              disponibles,
              enMantenimiento
            });
          }
        } catch (error) {
          console.warn('No se pudieron cargar estadísticas de espacios:', error);
        }
      } catch (error: unknown) {
        console.error('Error al cargar datos del dashboard:', error);
        const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los datos';
        toast.error('Error al cargar el dashboard', {
          description: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Mantenimiento</h2>
          <p className="text-muted-foreground">
            Gestión de espacios e inventario
          </p>
        </div>
      </div>

      {/* Alertas importantes */}
      {!loading && solicitudesPendientes.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    {solicitudesPendientes.length} solicitud{solicitudesPendientes.length > 1 ? 'es' : ''} de inventario pendiente{solicitudesPendientes.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Revisa y aprueba las solicitudes de inventario
                  </p>
                </div>
              </div>
              <Link to="/inventory/requests">
                <Button variant="outline" size="sm">
                  Revisar ahora
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Espacios</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.totalEspacios || espaciosStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.stats.espaciosDisponibles || espaciosStats?.disponibles || 0} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espacios Disponibles</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.stats.espaciosDisponibles || espaciosStats?.disponibles || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.stats.espaciosOcupados || 0} ocupados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Mantenimiento</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data?.stats.espaciosEnMantenimiento || espaciosStats?.enMantenimiento || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {solicitudesPendientes.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren revisión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas de inventario */}
      {!loading && inventarioStats && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{inventarioStats.totalItems || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{inventarioStats.disponibles || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Mantenimiento</p>
                <p className="text-2xl font-bold text-yellow-600">{inventarioStats.mantenimiento || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dañados</p>
                <p className="text-2xl font-bold text-red-600">{inventarioStats.danados || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solicitudes pendientes */}
      {!loading && solicitudesPendientes.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Solicitudes de Inventario Pendientes</CardTitle>
            <Link to="/inventory/requests">
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {solicitudesPendientes.slice(0, 5).map((solicitud) => (
                <div
                  key={solicitud.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{solicitud.tipoElementoNombre}</p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {solicitud.cantidadSolicitada} • Espacio: {solicitud.espacioNombre}
                    </p>
                    {solicitud.observaciones && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {solicitud.observaciones}
                      </p>
                    )}
                  </div>
                  <Link to="/inventory/requests">
                    <Button variant="outline" size="sm">
                      Revisar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/rooms">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestionar Espacios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ver y editar espacios del sistema
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/inventory">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gestionar Inventario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ver y gestionar items de inventario
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/inventory/requests">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Solicitudes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Revisar solicitudes de inventario
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

