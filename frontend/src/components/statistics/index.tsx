import { useSearchParams } from 'react-router-dom';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import InventoryStats from './InventoryStats';
import ReservationStatsAnalista from './ReservationStatsAnalista';
import { PageHeader } from '@/components/layouts/PageHeader';

export default function Statistics() {
  const { hasPermission } = useRolePermissions();
  const [searchParams] = useSearchParams();

  // La vista viene de la URL: las dos cuelgan de Estadísticas en el sidebar.
  const esInventario = searchParams.get('tab') === 'inventario';

  // Permission-based logic
  const canViewReservationStats = hasPermission('estadisticas:ver');
  const canManageInventory = hasPermission('inventario:editar');
  const canViewInventoryStats = hasPermission('inventario:ver');

  // ADMIN (usuarios que pueden gestionar inventario Y ver estadísticas) ven ambas vistas
  if (canManageInventory && canViewReservationStats) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Estadísticas"
          description={
            esInventario
              ? 'Inventario: stock, estado y asignación por espacio.'
              : 'Reservas, con el detalle por espacio y por período.'
          }
          accentColor={esInventario ? '#F6CA21' : '#184897'}
        />
        {esInventario ? <InventoryStats /> : <ReservationStatsAnalista />}
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
