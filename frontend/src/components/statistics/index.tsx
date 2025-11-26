import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/config/constants';
import InventoryStats from './InventoryStats';
import ReservationStatsAnalista from './ReservationStatsAnalista';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Package } from 'lucide-react';

export default function Statistics() {
  const { user } = useAuth();
  const isAdmin = user?.rol === ROLES.ADMIN;
  const isAnalista = user?.rol === ROLES.ANALISTA;
  const isMantenimiento = user?.rol === ROLES.MANTENIMIENTO;

  // ADMIN ve ambos con tabs
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-muted-foreground">
            Visualiza las estadísticas de reservas e inventario
          </p>
        </div>
        <Tabs defaultValue="reservas" className="w-full">
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

  // ANALISTA solo ve estadísticas de reservas
  if (isAnalista) {
    return (
      <div className="space-y-6">
        <ReservationStatsAnalista />
      </div>
    );
  }

  // MANTENIMIENTO solo ve estadísticas de inventario
  if (isMantenimiento) {
    return (
      <div className="space-y-6">
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