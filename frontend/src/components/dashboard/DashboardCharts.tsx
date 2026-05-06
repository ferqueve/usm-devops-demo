import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { Reserva } from '@/lib/types/spaces';

interface DashboardChartsProps {
  reservas: Reserva[];
  loading?: boolean;
}

const COLORS = {
  APROBADO: '#10b981', // green
  PENDIENTE: '#f59e0b', // yellow
  CANCELADO: '#ef4444', // red
};

const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ reservas, loading = false }: Readonly<DashboardChartsProps>) {
  // Datos para gráfico de reservas por estado
  const reservasPorEstado = useMemo(() => {
    const estados = reservas.reduce((acc, reserva) => {
      acc[reserva.estado] = (acc[reserva.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Aprobadas', value: estados.APROBADO || 0, color: COLORS.APROBADO },
      { name: 'Pendientes', value: estados.PENDIENTE || 0, color: COLORS.PENDIENTE },
      { name: 'Canceladas', value: estados.CANCELADO || 0, color: COLORS.CANCELADO },
    ].filter(item => item.value > 0);
  }, [reservas]);

  // Datos para gráfico de reservas por día de la semana
  const reservasPorDiaSemana = useMemo(() => {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const reservasPorDia = reservas.reduce((acc, reserva) => {
      const fecha = new Date(reserva.inicio);
      const diaSemana = fecha.getDay();
      const diaIndex = diaSemana === 0 ? 6 : diaSemana - 1; // Ajustar para que lunes sea 0
      acc[diaIndex] = (acc[diaIndex] || 0) + 1;
      return acc;
    }, Array.from<number>({ length: 7 }).fill(0));

    return dias.map((dia, index) => ({
      dia,
      reservas: reservasPorDia[index] || 0
    }));
  }, [reservas]);

  // Datos para gráfico de ocupación de espacios (top 5 para resumen)
  const ocupacionPorEspacio = useMemo(() => {
    const espacios = reservas.reduce((acc, reserva) => {
      if (!acc[reserva.espacioNombre]) {
        acc[reserva.espacioNombre] = 0;
      }
      if (reserva.estado === 'APROBADO') {
        acc[reserva.espacioNombre]++;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(espacios)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [reservas]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfico de reservas por estado */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          {reservasPorEstado.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reservasPorEstado}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reservasPorEstado.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No hay datos para mostrar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de reservas por día de la semana */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas por Día de la Semana</CardTitle>
        </CardHeader>
        <CardContent>
          {reservasPorDiaSemana.some(d => d.reservas > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reservasPorDiaSemana}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="dia" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="reservas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No hay datos para mostrar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de ocupación de espacios */}
      {ocupacionPorEspacio.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top 5 Espacios Más Utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={ocupacionPorEspacio}
                layout="vertical"
                margin={{ left: 100, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  type="category"
                  dataKey="nombre"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

