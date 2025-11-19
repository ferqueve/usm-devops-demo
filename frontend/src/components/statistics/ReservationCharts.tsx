import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ReservaStats } from '@/lib/types/spaces';

interface ReservationChartsProps {
  stats: ReservaStats;
  reservasPorMesData: Array<{ mes: string; cantidad: number; mesCompleto: string }>;
  reservasPorDiaSemanaData: Array<{ dia: string; cantidad: number; orden: number }>;
  reservasPorEspacioData: Array<{ espacioId: number; nombre: string; cantidad: number }>;
  distribucionPorEstadoData: Array<{ name: string; value: number; color: string }>;
}

interface TooltipPayload {
  name?: string;
  value?: number;
  color?: string;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3">
        {payload.map((entry, index: number) => {
          const payloadEntry = entry as TooltipPayload;
          return (
            <p key={index} className="text-sm" style={{ color: payloadEntry.color }}>
              {payloadEntry.name}: {payloadEntry.value}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function ReservationCharts({
  stats,
  reservasPorMesData,
  reservasPorDiaSemanaData,
  reservasPorEspacioData,
  distribucionPorEstadoData,
}: ReservationChartsProps) {
  return (
    <div className="space-y-6">
      {/* Primera fila: Distribución por estado y Reservas por mes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de pastel: Distribución por estado */}
        {distribucionPorEstadoData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribucionPorEstadoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribucionPorEstadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de barras: Reservas por mes */}
        {reservasPorMesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reservas por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reservasPorMesData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mes" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Segunda fila: Reservas por día de semana y Top espacios */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de barras: Reservas por día de semana */}
        {reservasPorDiaSemanaData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reservas por Día de Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reservasPorDiaSemanaData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="dia" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de barras horizontal: Top espacios */}
        {reservasPorEspacioData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 10 Espacios Más Reservados</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={reservasPorEspacioData} 
                  layout="vertical"
                  margin={{ left: 100, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="nombre" 
                    type="category" 
                    width={90}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tercera fila: Gráfico combinado de tendencia mensual */}
      {reservasPorMesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendencia de Reservas por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reservasPorMesData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="cantidad" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cuarta fila: Comparación mes actual vs anterior */}
      {stats.reservasMesActual !== undefined && stats.reservasMesAnterior !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparación Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={[
                  { periodo: 'Mes Anterior', cantidad: stats.reservasMesAnterior },
                  { periodo: 'Mes Actual', cantidad: stats.reservasMesActual },
                ]}
                margin={{ bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="cantidad" 
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Cambio: {stats.diferenciaMesAnterior > 0 ? '+' : ''}{stats.diferenciaMesAnterior} 
                ({stats.porcentajeCambioMesAnterior > 0 ? '+' : ''}{stats.porcentajeCambioMesAnterior.toFixed(1)}%)
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

