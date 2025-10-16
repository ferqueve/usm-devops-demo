import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { dashboardStats } from "@/data/mock-data";
import type { Statistic } from "@/lib/types";

// Componente para mostrar estadísticas
function StatCard({ stat }: { stat: Statistic }) {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
        {stat.icon && <stat.icon className={`h-4 w-4 ${getTrendColor(stat.trend || 'neutral')}`} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className="text-xs text-muted-foreground">{stat.change}</p>
      </CardContent>
    </Card>
  );
}

// Vista del Dashboard Principal
export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Próximas reservas */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Próximas Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Clase de Programación</p>
                  <p className="text-sm text-muted-foreground">Aula 101 - 15 Ene, 09:00</p>
                </div>
                <Button variant="outline" size="sm">Ver detalles</Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Práctica de Redes</p>
                  <p className="text-sm text-muted-foreground">Laboratorio 2A - 15 Ene, 14:00</p>
                </div>
                <Button variant="outline" size="sm">Ver detalles</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado del sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Salones disponibles</span>
              <span className="text-sm font-medium text-green-600">8/11</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Usuarios activos</span>
              <span className="text-sm font-medium text-blue-600">156</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Reservas hoy</span>
              <span className="text-sm font-medium text-purple-600">24</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button>Nueva Reserva</Button>
            <Button variant="outline">Ver Calendario</Button>
            <Button variant="outline">Gestionar Salones</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}