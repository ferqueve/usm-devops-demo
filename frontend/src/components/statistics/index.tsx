import { useSearchParams } from 'react-router-dom';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import InventoryStats from './InventoryStats';
import ReservationStatsAnalista from './ReservationStatsAnalista';
import { PageHeader } from '@/components/layouts/PageHeader';

/**
 * Estadísticas: dos vistas, reservas e inventario.
 *
 * Cada una se muestra si el usuario tiene el permiso que piden sus endpoints, y
 * no el que sugiere su rol. Antes decidia con 'estadisticas:ver' -- que tiene
 * todo el mundo -- y con 'inventario:editar': un MANTENIMIENTO caia en la rama
 * de "ve las dos", abria la de reservas por defecto y la pantalla entera
 * respondia "Error al cargar estadisticas".
 */
export default function Statistics() {
  const { hasPermission } = useRolePermissions();
  const [searchParams] = useSearchParams();

  const puedeReservas = hasPermission('estadisticas:ver_reservas');
  const puedeInventario = hasPermission('estadisticas:ver_inventario');

  if (!puedeReservas && !puedeInventario) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>No tienes acceso a las estadísticas.</p>
      </div>
    );
  }

  // La vista viene de la URL: las dos cuelgan de Estadísticas en el sidebar.
  // Con una sola disponible, esa se muestra sin importar lo que diga la URL.
  const pedidaInventario = searchParams.get('tab') === 'inventario';
  const esInventario = puedeInventario && (pedidaInventario || !puedeReservas);

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
