import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import { PanelEstadistica } from '../PanelEstadistica';
import { EXPLICACIONES } from '../explicaciones';
import {
  statsApi,
  type AltaInventario,
  type DeltaInventario,
  type EvolucionEstadoPunto,
  type EvolucionParquePunto,
} from '@/lib/api/stats';
import { fechaCorta, type Rango } from '../periodo';
import { BarrasDivergentes } from '../graficos/BarrasDivergentes';
import { NEUTRO, SERIE_CLARO, SERIE_OSCURO } from '@/lib/design/paleta';
import { MARCA } from '@/lib/design/paleta';
import { GloboGrafico } from '@/components/common/dataviz';

/* Misma historia que en statistics/reservas/Tendencia: este archivo también
   tenía su copia de la escala vieja. Ahora sale de lib/design/paleta. */
const TEMAS = {
  claro: {
    disponibles: SERIE_CLARO.verde, mantenimiento: SERIE_CLARO.amarillo, danados: SERIE_CLARO.rojo,
    parque: SERIE_CLARO.azul, grilla: NEUTRO.claro.grilla, eje: NEUTRO.claro.eje,
  },
  oscuro: {
    disponibles: SERIE_OSCURO.verde, mantenimiento: SERIE_OSCURO.amarillo, danados: SERIE_OSCURO.rojo,
    parque: SERIE_OSCURO.azul, grilla: NEUTRO.oscuro.grilla, eje: NEUTRO.oscuro.eje,
  },
};

const ESTADOS = [
  { clave: 'disponibles', etiqueta: 'Disponibles' },
  { clave: 'mantenimiento', etiqueta: 'En mantenimiento' },
  { clave: 'danados', etiqueta: 'Dañados' },
] as const;

function Globo({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <GloboGrafico>
      <p className="mb-1 font-medium text-white/70">{fechaCorta(String(label))}</p>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="flex-1 text-white/70">{p.name}</span>
          <span className="font-semibold tabular-nums">{Number(p.value).toLocaleString('es-UY')}</span>
        </div>
      ))}
    </GloboGrafico>
  );
}

function cambio(diferencia: number): string {
  if (diferencia === 0) return 'sin cambios';
  return `${diferencia > 0 ? '+' : ''}${diferencia} en el período`;
}

function Resumen({ etiqueta, valor, detalle }: Readonly<{ etiqueta: string; valor: string; detalle: string }>) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{etiqueta}</div>
      <div className="mt-0.5 text-2xl font-semibold">{valor}</div>
      <div className="truncate text-xs text-muted-foreground" title={detalle}>{detalle}</div>
    </div>
  );
}

function Vacio() {
  return <p className="py-12 text-center text-sm text-muted-foreground">No hay fotos del inventario en el período.</p>;
}

/**
 * Cómo cambió el inventario dentro del período, a partir de la foto diaria
 * que se toma de madrugada.
 */
export function EvolucionInventario({ rango }: Readonly<{ rango: Rango }>) {
  const { resolvedTheme } = useTheme();
  const c = resolvedTheme === 'dark' ? TEMAS.oscuro : TEMAS.claro;

  const [estado, setEstado] = useState<EvolucionEstadoPunto[]>([]);
  const [parque, setParque] = useState<EvolucionParquePunto[]>([]);
  const [delta, setDelta] = useState<DeltaInventario | null>(null);
  const [altas, setAltas] = useState<AltaInventario[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    Promise.all([
      statsApi.evolucionEstadoInventario(rango),
      statsApi.evolucionParqueInventario(rango),
      statsApi.altasInventario(rango),
    ])
      .then(async ([ev, ep, al]) => {
        if (cancelado) return;
        const fotos = ep.data ?? [];
        setAltas(al.data ?? []);
        setEstado(ev.data ?? []);
        setParque(fotos);
        // Se compara la primera foto del período con la última que existe, no
        // con el último día del período: la de hoy se toma de madrugada y,
        // hasta entonces, comparar contra ella daba todos los espacios en cero.
        if (fotos.length < 2) {
          setDelta(null);
          return;
        }
        const dl = await statsApi.deltaInventario(fotos[0].fecha, fotos.at(-1)!.fecha);
        if (!cancelado) setDelta(dl.data ?? null);
      })
      .catch((error) => {
        console.error('Error cargando la evolución del inventario', error);
        if (!cancelado) toast.error('No se pudo cargar la evolución del inventario');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [rango]);

  const cambios = (delta?.porEspacio ?? [])
    .filter((f) => f.deltaItems !== 0 || f.deltaUnidades !== 0)
    .sort((a, b) => Math.abs(b.deltaItems) - Math.abs(a.deltaItems));
  const primero = parque[0];
  const ultimo = parque.at(-1);
  const estadoInicio = estado[0];
  const estadoFin = estado.at(-1);
  const problemas = (p?: EvolucionEstadoPunto) => (p ? p.mantenimiento + p.danados : 0);
  const totalAltas = altas.reduce((a, x) => a + x.items, 0);

  const eje = {
    tick: { fontSize: 11, fill: c.eje },
    axisLine: false as const,
    tickLine: false as const,
  };

  return (
    <div className={`space-y-3 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Resumen
          etiqueta="Items"
          valor={primero && ultimo ? `${primero.items} → ${ultimo.items}` : '—'}
          detalle={primero && ultimo ? cambio(ultimo.items - primero.items) : 'sin fotos en el período'}
        />
        <Resumen
          etiqueta="Con problemas"
          valor={estadoInicio && estadoFin ? `${problemas(estadoInicio)} → ${problemas(estadoFin)}` : '—'}
          detalle="en mantenimiento o dañados, primera y última foto"
        />
        <Resumen
          etiqueta="Altas en el período"
          valor={totalAltas.toLocaleString('es-UY')}
          detalle={altas.length > 0 ? altas.slice(0, 3).map((a) => `${a.items} ${a.tipo.toLowerCase()}`).join(' · ') : 'ningún item nuevo'}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <PanelEstadistica
          title="Estado del parque"
          count={ultimo ? `items por estado · última foto del ${fechaCorta(ultimo.fecha)}` : 'items por estado'}
          accentColor={MARCA.verde}
          explicacion={EXPLICACIONES.evolucionEstado}
        >
          {(grande) => (
            <>
          {estado.length === 0 ? (
            <Vacio />
          ) : (
            <>
              {/* Apilado: la altura total es el parque y cada franja su estado; se ve cuánto pesa cada uno, no sólo si sube o baja. */}
              <ResponsiveContainer width="100%" height={grande ? 460 : 240}>
                <AreaChart data={estado} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={c.grilla} vertical={false} />
                  <XAxis dataKey="fecha" tickFormatter={fechaCorta} minTickGap={24} {...eje} axisLine={{ stroke: c.grilla }} />
                  <YAxis width={34} allowDecimals={false} {...eje} />
                  <Tooltip content={<Globo />} cursor={{ stroke: c.eje, strokeWidth: 1 }} />
                  {ESTADOS.map((e) => (
                    <Area
                      key={e.clave}
                      dataKey={e.clave}
                      name={e.etiqueta}
                      stackId="estado"
                      type="monotone"
                      stroke={c[e.clave]}
                      fill={c[e.clave]}
                      fillOpacity={0.35}
                      strokeWidth={1.5}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 px-1 text-xs text-muted-foreground">
                {ESTADOS.map((e) => (
                  <li key={e.clave} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c[e.clave], opacity: 0.7 }} />
                    {e.etiqueta}
                  </li>
                ))}
              </ul>
            </>
          )}
            </>
          )}
        </PanelEstadistica>

        <PanelEstadistica
          title="Tamaño del parque"
          count={primero && ultimo ? `${primero.items} → ${ultimo.items} items · ${ultimo.unidades.toLocaleString('es-UY')} unidades` : undefined}
          accentColor={MARCA.azul}
          explicacion={EXPLICACIONES.tamanoParque}
        >
          {(grande) => (
            <>
          {parque.length === 0 ? (
            <Vacio />
          ) : (
            // Solo items: unidades va en otra escala y en el mismo eje aplastaba la línea.
            <ResponsiveContainer width="100%" height={grande ? 460 : 240}>
              <AreaChart data={parque} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={c.grilla} vertical={false} />
                <XAxis dataKey="fecha" tickFormatter={fechaCorta} minTickGap={24} {...eje} axisLine={{ stroke: c.grilla }} />
                <YAxis width={34} allowDecimals={false} domain={['dataMin - 2', 'dataMax + 2']} {...eje} />
                <Tooltip content={<Globo />} cursor={{ stroke: c.eje, strokeWidth: 1 }} />
                <Area dataKey="items" name="Items" stroke={c.parque} strokeWidth={2} fill={c.parque} fillOpacity={0.12} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <ul className="mt-2 flex gap-x-5 px-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.parque, opacity: 0.7 }} />
              Items activos
            </li>
          </ul>
            </>
          )}
        </PanelEstadistica>
      </div>

      <PanelEstadistica
        title="Qué cambió"
        count={delta ? `entre el ${fechaCorta(delta.fechaInicio)} y el ${fechaCorta(delta.fechaFin)}` : undefined}
        accentColor={MARCA.naranja}
        scroll
        className="max-h-[360px]"
        explicacion={EXPLICACIONES.cambios}
      >
        {cambios.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Ningún espacio ganó ni perdió items en el período.</p>
        ) : (
          <BarrasDivergentes
            filas={cambios.map((f) => ({
              nombre: f.espacioNombre,
              valor: f.deltaItems,
              detalle: `${f.itemsInicio} → ${f.itemsFin} items · ${f.deltaUnidades > 0 ? '+' : ''}${f.deltaUnidades} unidades`,
            }))}
          />
        )}
      </PanelEstadistica>
    </div>
  );
}
