import { useRolePermissions } from '@/hooks/useRolePermissions';
import InventoryStats from './InventoryStats';
import ReservationStatsAnalista from './ReservationStatsAnalista';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Package } from 'lucide-react';
import { PageHeader } from '@/components/layouts/PageHeader';

export default function Statistics() {
  const { hasPermission } = useRolePermissions();

  // Permission-based logic
  const canViewReservationStats = hasPermission('estadisticas:ver');
  const canManageInventory = hasPermission('inventario:editar');
  const canViewInventoryStats = hasPermission('inventario:ver');

  // ADMIN (usuarios que pueden gestionar inventario Y ver estadísticas) ven ambos con tabs
  if (canManageInventory && canViewReservationStats) {
    return (
      <div className="space-y-6">
        <Tabs defaultValue="reservas" className="w-full">
          <PageHeader
            title="Estadísticas"
            description="Reservas e inventario, con el detalle por espacio y por período."
            accentColor="#184897"
            nav={
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="reservas">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Reservas
                  </TabsTrigger>
                  <TabsTrigger value="inventario">
                    <Package className="h-4 w-4 mr-2" />
                    Inventario
                  </TabsTrigger>
                </TabsList>
                {/* Cada tab portaliza sus acciones acá: quedan con la pestaña que
                    las manda, no en la barra, que es de la pantalla entera. */}
                <div id="stats-actions-slot" className="flex items-center gap-2" />
              </div>
            }
          />
          <TabsContent value="reservas" className="space-y-6">
            <ReservationStatsAnalista />
          </TabsContent>
          <TabsContent value="inventario" className="space-y-6">
            <InventoryStats />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ANALISTA (usuarios que pueden ver estadísticas pero NO gestionar inventario) solo ven estadísticas de reservas
  if (canViewReservationStats && !canManageInventory) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Estadísticas"
          description="Reservas, con el detalle por espacio y por período."
          accentColor="#184897"
        />
        <ReservationStatsAnalista />
      </div>
    );
  }

  // MANTENIMIENTO (usuarios que pueden ver inventario pero NO estadísticas) solo ven estadísticas de inventario
  if (canViewInventoryStats && !canViewReservationStats) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Estadísticas"
          description="Inventario: stock, estado y asignación por espacio."
          accentColor="#F6CA21"
        />
        <InventoryStats />
      </div>
    );
  }

  // Sin acceso
  return (
    <div className="text-center text-muted-foreground py-12">
      <p>No tienes acceso a las estadísticas.</p>
    </div>
  );
}