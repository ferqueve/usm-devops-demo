import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertCircle, CheckCircle, Wrench } from "lucide-react";

interface InventoryStatsCardsProps {
  statistics: {
    totalItems: number;
    disponibles: number;
    mantenimiento: number;
    danados: number;
    sinAsignar: number;
  } | null;
}

export default function InventoryStatsCards({ statistics }: InventoryStatsCardsProps) {
  const totalItems = statistics?.totalItems || 0;
  const disponibles = statistics?.disponibles || 0;
  const mantenimiento = statistics?.mantenimiento || 0;
  const danados = statistics?.danados || 0;
  const sinAsignar = statistics?.sinAsignar || 0;
  
  const porEstado = {
    'DISPONIBLE': disponibles,
    'MANTENIMIENTO': mantenimiento,
    'DANADO': danados
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total de Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItems}</div>
          <p className="text-xs text-muted-foreground">
            {porEstado['DISPONIBLE'] || 0} disponibles
          </p>
        </CardContent>
      </Card>

      {/* Items por Estado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Estado</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Detalle de estados */}
            <div className="space-y-2">
              {Object.entries(porEstado).map(([estado, count]) => {
                const porcentaje = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
                
                const getConfig = (estado: string) => {
                  switch (estado) {
                    case 'DISPONIBLE':
                      return { label: 'Disponible', textColor: 'text-emerald-700', icon: CheckCircle };
                    case 'MANTENIMIENTO':
                      return { label: 'Mantenimiento', textColor: 'text-amber-700', icon: Wrench };
                    case 'DANADO':
                      return { label: 'Dañado', textColor: 'text-red-700', icon: AlertCircle };
                    default:
                      return { label: estado, textColor: 'text-gray-700', icon: AlertCircle };
                  }
                };
                
                const config = getConfig(estado);
                const Icon = config.icon;
                
                return (
                  <div key={estado} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${config.textColor}`} />
                      <span className="font-medium">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{count}</span>
                      <span className="font-semibold text-xs">{porcentaje}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Barra combinada */}
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
              {Object.entries(porEstado).map(([estado, count]) => {
                const porcentaje = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
                
                const getConfig = (estado: string) => {
                  switch (estado) {
                    case 'DISPONIBLE':
                      return { bgColor: 'bg-emerald-500', textColor: 'text-emerald-700', icon: CheckCircle };
                    case 'MANTENIMIENTO':
                      return { bgColor: 'bg-amber-500', textColor: 'text-amber-700', icon: Wrench };
                    case 'DANADO':
                      return { bgColor: 'bg-red-500', textColor: 'text-red-700', icon: AlertCircle };
                    default:
                      return { bgColor: 'bg-gray-500', textColor: 'text-gray-700', icon: AlertCircle };
                  }
                };
                
                const config = getConfig(estado);
                
                return (
                  <div
                    key={estado}
                    className={`${config.bgColor} transition-all duration-500`}
                    style={{ width: `${porcentaje}%` }}
                  />
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sin Asignar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sin Asignar</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sinAsignar}</div>
          <p className="text-xs text-muted-foreground">
            {sinAsignar > 0 ? 'Requieren asignación' : 'Todos asignados'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
