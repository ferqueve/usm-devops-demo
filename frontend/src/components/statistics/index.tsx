import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/config/constants';
import InventoryStats from './InventoryStats';
import ReservationStatsAnalista from './ReservationStatsAnalista';

export default function Statistics() {
  const { user } = useAuth();
  const isAnalista = user?.rol === ROLES.ANALISTA || user?.rol === ROLES.ADMIN;
  const isMantenimiento = user?.rol === ROLES.MANTENIMIENTO;

  return (
    <div className="space-y-6">
      {isAnalista && <ReservationStatsAnalista />}
      {isMantenimiento && <InventoryStats />}
      {!isAnalista && !isMantenimiento && (
        <div className="text-center text-muted-foreground py-12">
          <p>No tienes acceso a las estadísticas.</p>
        </div>
      )}
    </div>
  );
}