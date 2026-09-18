import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import type { TooltipProps } from 'recharts';

export interface NodoArbol {
  nombre: string;
  /** Define el tamaño del rectángulo. */
  valor: number;
  color: string;
  /** Texto chico debajo del nombre y en el globo. */
  detalle?: string;
  /** Color del texto sobre el rectángulo. */
  texto?: string;
  /** Si está, el rectángulo filtra la vista. */
  alClic?: () => void;
}

interface CeldaProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  nombre?: string;
  detalle?: string;
  color?: string;
  texto?: string;
  alClic?: () => void;
}

function Celda({ x = 0, y = 0, width = 0, height = 0, nombre, detalle, color, texto, alClic }: CeldaProps) {
  const cabe = width > 60 && height > 32;
  const cabeDetalle = width > 80 && height > 50;
  return (
    <g onClick={alClic} style={alClic ? { cursor: 'pointer' } : undefined}>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={color} stroke="var(--card)" strokeWidth={2} />
      {cabe && (
        <text x={x + 8} y={y + 18} fill={texto ?? '#fff'} style={{ fontSize: 12, fontWeight: 600 }}>
          {nombre && nombre.length * 7 > width - 12 ? `${nombre.slice(0, Math.max(3, Math.floor((width - 16) / 7)))}…` : nombre}
        </text>
      )}
      {cabeDetalle && detalle && (
        <text x={x + 8} y={y + 34} fill={texto ?? '#fff'} fillOpacity={0.85} style={{ fontSize: 11 }}>
          {detalle.length * 6 > width - 12 ? `${detalle.slice(0, Math.max(3, Math.floor((width - 16) / 6)))}…` : detalle}
        </text>
      )}
    </g>
  );
}

function Globo({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as NodoArbol;
  return (
    <div className="rounded-lg bg-chrome px-3 py-1.5 text-xs text-white shadow-lg">
      <b>{p.nombre}</b>
      {p.detalle && <div className="text-white/75">{p.detalle}</div>}
      {p.alClic && <div className="mt-0.5 text-[10px] text-white/60">Clic para filtrar por este espacio</div>}
    </div>
  );
}

/**
 * Mapa de árbol: el área es cuánto pesa cada parte del total y el color
 * agrega una segunda lectura (ocupación, problemas). Deja ver de un golpe
 * dónde se concentra algo, cosa que una lista de barras no muestra.
 */
export function MapaArbol({ nodos, alto = 280 }: Readonly<{ nodos: NodoArbol[]; alto?: number }>) {
  const datos = nodos.filter((n) => n.valor > 0);
  if (datos.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para mostrar.</p>;
  return (
    // El Treemap de recharts no le pone tamaño en línea a su svg, y la regla
    // global de index.css que achica los íconos lo dejaba en 12 px.
    <div className="[&_svg.recharts-surface]:!h-full [&_svg.recharts-surface]:!w-full">
      <ResponsiveContainer width="100%" height={alto}>
        <Treemap data={datos} dataKey="valor" nameKey="nombre" isAnimationActive={false} content={<Celda />}>
          <Tooltip content={<Globo />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
