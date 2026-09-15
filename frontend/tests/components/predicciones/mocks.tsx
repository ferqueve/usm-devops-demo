/**
 * Recharts no dibuja en jsdom (no hay tamaño): cada gráfico se reemplaza por
 * un div que deja pasar a sus hijos. Se declara explícito, como en el resto de
 * los tests, para que un componente nuevo que falte rompa a la vista.
 */
export function rechartsFalso() {
  const S = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const N = () => null;
  return {
    ResponsiveContainer: S,
    ComposedChart: S,
    BarChart: S,
    LineChart: S,
    AreaChart: S,
    PieChart: S,
    RadarChart: S,
    Area: N,
    Bar: S,
    Line: N,
    Cell: N,
    Pie: S,
    Radar: N,
    PolarGrid: N,
    PolarAngleAxis: N,
    CartesianGrid: N,
    Tooltip: N,
    XAxis: N,
    YAxis: N,
    ReferenceLine: N,
  };
}
