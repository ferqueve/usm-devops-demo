import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { Espacio, Reserva, ReservaStats } from '@/lib/types/spaces';

interface DashboardChartsProps {
  reservas: Reserva[];
  /**
   * Si está disponible, los charts se calculan a partir de las agregaciones
   * pre-calculadas del backend (mucho más liviano que descargar la lista
   * completa de reservas para contar en cliente). Si no, cae al cálculo
   * tradicional sobre {@link reservas}.
   */
  stats?: ReservaStats | null;
  /** Necesario para mapear IDs de espacio devueltos por stats a nombres. */
  espacios?: Espacio[];
  loading?: boolean;
}

// Lunes a Domingo en el orden visual que querés (DayOfWeek de Java viene en MAYÚSCULAS inglés).
const DIAS_SEMANA_MAP: Array<{ key: string; label: string }> = [
  { key: 'MONDAY', label: 'Lunes' },
  { key: 'TUESDAY', label: 'Martes' },
  { key: 'WEDNESDAY', label: 'Miércoles' },
  { key: 'THURSDAY', label: 'Jueves' },
  { key: 'FRIDAY', label: 'Viernes' },
  { key: 'SATURDAY', label: 'Sábado' },
  { key: 'SUNDAY', label: 'Domingo' },
];

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

export default function DashboardCharts({ reservas, stats, espacios = [], loading = false }: Readonly<DashboardChartsProps>) {
  const espaciosById = useMemo(() => {
    const map = new Map<string, string>();
    for (const esp of espacios) {
      map.set(String(esp.id), esp.nombre);
    }
    return map;
  }, [espacios]);
  // Datos para gráfico de reservas por estado.
  // Prioridad: stats agregados del backend > cálculo en cliente.
  const reservasPorEstado = useMemo(() => {
    const conteos = stats?.reservasPorEstado
      ? stats.reservasPorEstado
      : reservas.reduce((acc, reserva) => {
          acc[reserva.estado] = (acc[reserva.estado] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

    return [
      { name: 'Aprobadas', value: conteos.APROBADO || 0, color: COLORS.APROBADO },
      { name: 'Pendientes', value: conteos.PENDIENTE || 0, color: COLORS.PENDIENTE },
      { name: 'Canceladas', value: conteos.CANCELADO || 0, color: COLORS.CANCELADO },
    ].filter(item => item.value > 0);
  }, [reservas, stats]);

  // Datos para gráfico de reservas por día de la semana.
  const reservasPorDiaSemana = useMemo(() => {
    if (stats?.reservasPorDiaSemana) {
      return DIAS_SEMANA_MAP.map(({ key, label }) => ({
        dia: label,
        reservas: stats.reservasPorDiaSemana[key] || 0,
      }));
    }
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const reservasPorDia = reservas.reduce((acc, reserva) => {
      const fecha = new Date(reserva.inicio);
      const diaSemana = fecha.getDay();
      const diaIndex = diaSemana === 0 ? 6 : diaSemana - 1;
      acc[diaIndex] = (acc[diaIndex] || 0) + 1;
      return acc;
    }, Array.from<number>({ length: 7 }).fill(0));

    return dias.map((dia, index) => ({
      dia,
      reservas: reservasPorDia[index] || 0,
    }));
  }, [reservas, stats]);

  // Datos para gráfico de ocupación de espacios (top 5 para resumen)
  const ocupacionPorEspacio = useMemo(() => {
    if (stats?.reservasPorEspacio) {
      return Object.entries(stats.reservasPorEspacio)
        .map(([idOrNombre, cantidad]) => ({
          nombre: espaciosById.get(idOrNombre) ?? idOrNombre,
          cantidad: Number(cantidad),
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);
    }
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
  }, [reservas, stats]);

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

