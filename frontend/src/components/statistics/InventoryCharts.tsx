import { useMemo } from 'react';
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
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { InventoryStats } from '@/lib/types/spaces';

interface InventoryChartsProps {
  stats: InventoryStats;
  loading?: boolean;
}

const COLORS = {
  DISPONIBLE: '#10b981', // green
  MANTENIMIENTO: '#f59e0b', // yellow
  DANADO: '#ef4444', // red
  SIN_ASIGNAR: '#6b7280', // gray
};

const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#f97316', '#84cc16', '#e11d48', '#6366f1'
];

const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3">
        {payload.map((entry, index) => (
          <p key={`${entry.name ?? 'entry'}-${index}`} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function InventoryCharts({ stats, loading = false }: Readonly<InventoryChartsProps>) {
  // Datos para gráfico de distribución por estado
  const distribucionPorEstado = useMemo(() => {
    return [
      { name: 'Disponibles', value: stats.disponibles, color: COLORS.DISPONIBLE },
      { name: 'Mantenimiento', value: stats.mantenimiento, color: COLORS.MANTENIMIENTO },
      { name: 'Dañados', value: stats.danados, color: COLORS.DANADO },
      { name: 'Sin Asignar', value: stats.sinAsignar, color: COLORS.SIN_ASIGNAR },
    ].filter(item => item.value > 0);
  }, [stats]);

  // Datos para gráfico de top espacios
  const topEspaciosChart = useMemo(() => {
    return stats.topEspacios
      .slice(0, 10)
      .map((espacio, index) => ({
        nombre: espacio.espacioNombre,
        cantidad: espacio.cantidad,
        items: espacio.items,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));
  }, [stats.topEspacios]);

  // Datos para gráfico de top tipos
  const topTiposChart = useMemo(() => {
    return stats.topTipos
      .slice(0, 10)
      .map((tipo, index) => ({
        nombre: tipo.tipoNombre,
        cantidad: tipo.cantidad,
        items: tipo.items,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));
  }, [stats.topTipos]);

  // Datos para gráfico apilado de estados por tipo
  const estadosPorTipoChart = useMemo(() => {
    return stats.itemsPorTipo
      .slice(0, 8)
      .map(tipo => ({
        nombre: tipo.tipoNombre.length > 15 ? tipo.tipoNombre.substring(0, 15) + '...' : tipo.tipoNombre,
        disponibles: tipo.disponibles,
        mantenimiento: tipo.mantenimiento,
        danados: tipo.danados
      }));
  }, [stats.itemsPorTipo]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
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
    <div className="space-y-6">
      {/* Primera fila: Distribución por estado y Top Tipos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de pastel: Distribución por estado */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {distribucionPorEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribucionPorEstado}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribucionPorEstado.map((entry) => (
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

        {/* Gráfico de barras agrupadas: Top Tipos */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Tipos de Elemento</CardTitle>
          </CardHeader>
          <CardContent>
            {topTiposChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTiposChart} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    stroke="#9ca3af"
                    style={{ fontSize: '11px' }}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="cantidad" fill="#8b5cf6" name="Unidades" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="items" fill="#3b82f6" name="Registros" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No hay datos para mostrar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila: Top Espacios y Estados por Tipo */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de barras agrupadas: Top Espacios */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Espacios</CardTitle>
          </CardHeader>
          <CardContent>
            {topEspaciosChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topEspaciosChart} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    stroke="#9ca3af"
                    style={{ fontSize: '11px' }}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="cantidad" fill="#ec4899" name="Unidades" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="items" fill="#10b981" name="Registros" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No hay datos para mostrar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico apilado: Estados por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Estados por Tipo (Top 8)</CardTitle>
          </CardHeader>
          <CardContent>
            {estadosPorTipoChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={estadosPorTipoChart} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="nombre"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="disponibles" stackId="a" fill={COLORS.DISPONIBLE} name="Disponibles" />
                  <Bar dataKey="mantenimiento" stackId="a" fill={COLORS.MANTENIMIENTO} name="Mantenimiento" />
                  <Bar dataKey="danados" stackId="a" fill={COLORS.DANADO} name="Dañados" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No hay datos para mostrar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

