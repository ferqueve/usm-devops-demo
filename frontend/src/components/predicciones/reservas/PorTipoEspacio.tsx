import type { LucideIcon } from 'lucide-react';
import { Building2, CheckCircle2, FlaskConical, MousePointerClick, School, Shapes, Theater, TrendingDown, TrendingUp } from 'lucide-react';
import { Area, Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { SerieTipoEspacioPunto, TipoEspacioML } from '@/lib/api/stats';
import { useColores } from '../colores';
import { cambio, decimal, entero, fechaConDia, fechaCorta, fechaLarga, mayuscula, SVG_LLENO } from '../formato';
import { MARCA } from '@/lib/design/paleta';

/** Ícono por el nombre del tipo; los tipos se cargan a mano y no traen uno propio. */
function iconoTipo(nombre: string): LucideIcon {
  const n = nombre.toLowerCase();
  if (n.includes('aula') || n.includes('salón') || n.includes('salon')) return School;
  if (n.includes('lab')) return FlaskConical;
  if (n.includes('anfi') || n.includes('auditorio') || n.includes('sala')) return Theater;
  if (n.includes('otro')) return Shapes;
  return Building2;
}

function GloboMini({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as SerieTipoEspacioPunto;
  return (
    <div className="rounded-lg bg-chrome px-2.5 py-1.5 text-2xs text-white shadow-lg">
      <p className="mb-0.5 font-medium capitalize text-white/70">{fechaLarga(p.fecha)}</p>
      <p>
        Esperadas <b className="tabular-nums">{entero(p.prediccion)}</b>
        {p.bandaInferior != null && p.bandaSuperior != null && (
          <span className="text-white/50"> ({entero(p.bandaInferior)}–{entero(p.bandaSuperior)})</span>
        )}
      </p>
      <p>Ya aprobadas <b className="tabular-nums">{entero(p.reservadas)}</b></p>
    </div>
  );
}

/** El pronóstico de un tipo en miniatura: banda, línea y barras de lo ya aprobado, sin ejes. */
function MiniPronostico({ serie, alto }: Readonly<{ serie: SerieTipoEspacioPunto[]; alto: number }>) {
  const colores = useColores();
  const datos = serie.map((p) => ({
    ...p,
    piso: p.bandaInferior ?? p.prediccion,
    ancho: Math.max(0, (p.bandaSuperior ?? p.prediccion) - (p.bandaInferior ?? p.prediccion)),
  }));
  return (
    <div className={SVG_LLENO} style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={datos} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          {/* Escala propia por tipo: un aula y un laboratorio no se pueden leer en la misma. */}
          <YAxis hide domain={[0, 'dataMax']} />
          <Tooltip content={<GloboMini />} cursor={{ stroke: colores.eje, strokeWidth: 1 }} />
          <Area dataKey="piso" stackId="b" stroke="none" fill="transparent" activeDot={false} isAnimationActive={false} />
          <Area dataKey="ancho" stackId="b" stroke="none" fill={colores.prediccion} fillOpacity={0.16} activeDot={false} isAnimationActive={false} />
          <Bar dataKey="reservadas" fill={colores.reservadas} fillOpacity={0.6} barSize={3} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          <Line dataKey="prediccion" stroke={colores.prediccion} strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChipCambio({ valor }: Readonly<{ valor: number | null }>) {
  if (valor == null) return null;
  const sube = valor >= 0;
  // Neutro a propósito: que baje la demanda de un tipo no es malo, puede ser receso.
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-2xs font-semibold tabular-nums text-foreground" title="promedio diario esperado contra los últimos 30 días">
      {sube ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {cambio(valor)}
    </span>
  );
}

/**
 * Una tarjeta por tipo de espacio con su pronóstico en miniatura. Al tocarla,
 * el gráfico grande de arriba pasa a ese tipo (queda en la URL).
 */
export function PronosticoPorTipo({ tipos, elegido, onElegir, grande = false }: Readonly<{
  tipos: TipoEspacioML[];
  elegido: number | null;
  onElegir: (id: number | null) => void;
  grande?: boolean;
}>) {
  const colores = useColores();
  return (
    <div className={`grid gap-3 ${grande ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
      {tipos.map((t) => {
        const Icono = iconoTipo(t.nombre);
        const activo = t.tipoEspacioId === elegido;
        if (!t.entrenado) {
          return (
            <div key={t.tipoEspacioId} className="flex min-h-[180px] flex-col rounded-xl border border-dashed bg-muted/30 p-3 text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Icono className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{t.nombre}</div>
                  <div className="text-2xs">{t.espacios} {t.espacios === 1 ? 'espacio' : 'espacios'}</div>
                </div>
              </div>
              <p className="m-auto max-w-[220px] py-3 text-center text-xs leading-relaxed">
                Sin modelo propio: tiene muy poca historia para pronosticarlo por separado. Cuenta en el total del campus.
              </p>
            </div>
          );
        }
        const gana = t.wape != null && t.wapeIngenuo != null && t.wape < t.wapeIngenuo;
        return (
          <button
            key={t.tipoEspacioId}
            type="button"
            onClick={() => onElegir(activo ? null : t.tipoEspacioId)}
            aria-pressed={activo}
            title={activo ? 'Volver al campus' : `Ver el pronóstico de ${t.nombre}`}
            className={`group flex min-w-0 flex-col rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-utec-orange/50 ${
              activo ? 'border-transparent ring-2 ring-utec-orange' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: activo ? MARCA.naranja : MARCA.azul }}
                >
                  <Icono className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{t.nombre}</div>
                  <div className="text-2xs text-muted-foreground">{t.espacios} {t.espacios === 1 ? 'espacio' : 'espacios'}</div>
                </div>
              </div>
              <ChipCambio valor={t.cambioPct} />
            </div>

            <div className="mt-2">
              <MiniPronostico serie={t.serie} alto={grande ? 130 : 76} />
            </div>

            <dl className="mt-2 grid grid-cols-3 gap-1 border-t pt-2 text-center">
              <div>
                <dt className="text-2xs uppercase tracking-wide text-muted-foreground">7 días</dt>
                <dd className="text-sm font-semibold tabular-nums">{entero(t.esperadoProximos7)}</dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-wide text-muted-foreground">30 días</dt>
                <dd className="text-sm font-semibold tabular-nums">{entero(t.esperadoProximos30)}</dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-wide text-muted-foreground">Pico</dt>
                <dd className="truncate text-sm font-semibold tabular-nums" title={t.picoFecha ? fechaLarga(t.picoFecha) : undefined}>
                  {t.picoFecha ? fechaCorta(t.picoFecha) : '—'}
                </dd>
              </div>
            </dl>

            <div className="mt-2 flex items-center justify-between gap-2 text-2xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                {gana && <CheckCircle2 className="h-3 w-3" style={{ color: colores.reservadas }} />}
                error {t.wape == null ? '—' : `${decimal(t.wape, 0)}%`}
                {t.wapeIngenuo != null && <span className="text-muted-foreground/70">· simple {decimal(t.wapeIngenuo, 0)}%</span>}
              </span>
              <span className={`inline-flex items-center gap-1 font-medium ${activo ? 'text-marca-naranja-texto' : 'opacity-0 transition-opacity group-hover:opacity-100'}`}>
                <MousePointerClick className="h-3 w-3" />
                {activo ? 'viendo' : 'ver'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** La tabla de los tipos: lo mismo que las tarjetas, alineado para comparar. */
export function TablaTipos({ tipos, elegido, onElegir }: Readonly<{
  tipos: TipoEspacioML[];
  elegido: number | null;
  onElegir: (id: number | null) => void;
}>) {
  const colores = useColores();
  const maxError = Math.max(1, ...tipos.flatMap((t) => [t.wape ?? 0, t.wapeIngenuo ?? 0]));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="text-2xs uppercase tracking-wide text-muted-foreground">
          <tr className="border-b">
            <th className="px-3 py-2 text-left font-medium">Tipo</th>
            <th className="px-3 py-2 text-right font-medium" title="Promedio diario de reservas aprobadas en el histórico">Hoy por día</th>
            <th className="px-3 py-2 text-right font-medium">Próx. 7 días</th>
            <th className="px-3 py-2 text-right font-medium">Próx. 30 días</th>
            <th className="px-3 py-2 text-right font-medium">Cambio</th>
            <th className="px-3 py-2 text-left font-medium">Día pico</th>
            <th className="px-3 py-2 text-left font-medium">Error contra simple</th>
          </tr>
        </thead>
        <tbody>
          {tipos.map((t) => {
            const activo = t.tipoEspacioId === elegido;
            const cobertura7 = t.esperadoProximos7 && t.reservadasProximos7 != null ? Math.min(100, (t.reservadasProximos7 / t.esperadoProximos7) * 100) : null;
            return (
              <tr
                key={t.tipoEspacioId}
                onClick={t.entrenado ? () => onElegir(activo ? null : t.tipoEspacioId) : undefined}
                className={`border-b border-border/60 last:border-0 ${t.entrenado ? 'cursor-pointer hover:bg-muted/40' : 'text-muted-foreground'} ${activo ? 'bg-utec-orange/10' : ''}`}
              >
                <td className="px-3 py-2">
                  <div className="font-medium">{t.nombre}</div>
                  <div className="text-2xs text-muted-foreground">
                    {t.espacios} {t.espacios === 1 ? 'espacio' : 'espacios'}
                    {!t.entrenado && ' · sin modelo'}
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{decimal(t.promedioDiarioHistorico)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <div className="font-semibold">{entero(t.esperadoProximos7)}</div>
                  {cobertura7 != null && (
                    <div className="ml-auto mt-0.5 h-1 w-14 overflow-hidden rounded-full bg-muted" title={`${entero(t.reservadasProximos7)} ya aprobadas`}>
                      <div className="h-full rounded-full" style={{ width: `${cobertura7}%`, backgroundColor: colores.reservadas }} />
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{entero(t.esperadoProximos30)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{cambio(t.cambioPct)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {t.picoFecha ? (
                    <>
                      <span>{mayuscula(fechaConDia(t.picoFecha))}</span>
                      <span className="ml-1 text-muted-foreground tabular-nums">· {entero(t.picoValor)}</span>
                    </>
                  ) : '—'}
                </td>
                <td className="px-3 py-2">
                  {t.wape == null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="grid w-40 grid-cols-[1fr_auto] items-center gap-x-2 gap-y-0.5 text-2xs tabular-nums">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${(t.wape / maxError) * 100}%`, backgroundColor: colores.prediccion }} />
                      </div>
                      <span className="font-semibold">{decimal(t.wape, 0)}%</span>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${((t.wapeIngenuo ?? 0) / maxError) * 100}%`, backgroundColor: colores.referencia }} />
                      </div>
                      <span className="text-muted-foreground">{t.wapeIngenuo == null ? '—' : `${decimal(t.wapeIngenuo, 0)}%`}</span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-3 pb-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: colores.prediccion }} />error del modelo</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: colores.referencia }} />repetir la última semana</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1 w-4 rounded-full" style={{ backgroundColor: colores.reservadas }} />ya aprobado de los próximos 7 días</span>
      </div>
    </div>
  );
}
