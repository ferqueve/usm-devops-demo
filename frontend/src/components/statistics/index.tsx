import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { mockStatistics } from "@/data/mock-data";
import type { Statistic } from "@/core/types/types";

// Componente para mostrar estadísticas
function StatCard({ stat }: { stat: Statistic }) {
  const Icon = stat.icon;
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
        <Icon className={`h-4 w-4 ${getTrendColor(stat.trend)}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className="text-xs text-muted-foreground">{stat.change}</p>
      </CardContent>
    </Card>
  );
}

// Vista de Estadísticas y Reportes
export default function Statistics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estadísticas y Reportes</h2>
          <p className="text-muted-foreground">Análisis y reportes de uso de salones</p>
        </div>
        <Button>
          <span className="mr-2">📊</span>
          Generar Reporte
        </Button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mockStatistics.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Gráficos y análisis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ocupación por tipo de salón */}
        <Card>
          <CardHeader>
            <CardTitle>Ocupación por Tipo de Salón</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: "Aulas", percentage: 85, color: "bg-blue-500" },
                { type: "Laboratorios", percentage: 72, color: "bg-green-500" },
                { type: "Auditorios", percentage: 45, color: "bg-purple-500" },
                { type: "Salas de Reuniones", percentage: 68, color: "bg-orange-500" }
              ].map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.type}</span>
                    <span>{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reservas por día de la semana */}
        <Card>
          <CardHeader>
            <CardTitle>Reservas por Día de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { day: "Lunes", count: 45, color: "bg-blue-500" },
                { day: "Martes", count: 52, color: "bg-green-500" },
                { day: "Miércoles", count: 48, color: "bg-purple-500" },
                { day: "Jueves", count: 61, color: "bg-orange-500" },
                { day: "Viernes", count: 38, color: "bg-red-500" },
                { day: "Sábado", count: 12, color: "bg-gray-500" },
                { day: "Domingo", count: 5, color: "bg-gray-400" }
              ].map((item) => (
                <div key={item.day} className="flex items-center justify-between">
                  <span className="text-sm">{item.day}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Salones más utilizados */}
        <Card>
          <CardHeader>
            <CardTitle>Salones Más Utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { room: "Aula 101", usage: 92, reservations: 156 },
                { room: "Laboratorio 2A", usage: 88, reservations: 142 },
                { room: "Auditorio Principal", usage: 75, reservations: 89 },
                { room: "Sala de Reuniones 3", usage: 68, reservations: 67 },
                { room: "Aula 205", usage: 65, reservations: 98 }
              ].map((item, index) => (
                <div key={item.room} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{item.room}</p>
                      <p className="text-sm text-muted-foreground">{item.reservations} reservas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{item.usage}%</p>
                    <p className="text-xs text-muted-foreground">ocupación</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tendencias mensuales */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencias Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: "Enero", reservations: 342, trend: "up" },
                { month: "Febrero", reservations: 298, trend: "down" },
                { month: "Marzo", reservations: 315, trend: "up" },
                { month: "Abril", reservations: 289, trend: "down" },
                { month: "Mayo", reservations: 356, trend: "up" },
                { month: "Junio", reservations: 378, trend: "up" }
              ].map((item) => (
                <div key={item.month} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{item.reservations}</span>
                    <span className={`text-xs ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.trend === 'up' ? '↗' : '↘'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Generar Reporte Personalizado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Período</label>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm">Semana</Button>
                <Button variant="outline" size="sm">Mes</Button>
                <Button variant="outline" size="sm">Trimestre</Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Salón</label>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm">Todos</Button>
                <Button variant="outline" size="sm">Aulas</Button>
                <Button variant="outline" size="sm">Laboratorios</Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Formato</label>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm">PDF</Button>
                <Button variant="outline" size="sm">Excel</Button>
                <Button variant="outline" size="sm">CSV</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

