import type { OcupacionEspacio, ResumenCarrera, TopUsuario } from '@/lib/api/stats';
import { filtrable, HOVER_FILTRO } from '../graficos/filtrable';
import { horas, nombreRol } from './formato';
import { Vacio } from '@/components/statistics/Vacio';

const n = (v: number) => Number(v).toLocaleString('es-UY');


function Barra({ porcentaje, clase }: Readonly<{ porcentaje: number; clase: string }>) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${clase}`} style={{ width: `${Math.max(0, Math.min(100, porcentaje))}%` }} />
    </div>
  );
}

/**
 * Qué parte del horario del campus estuvo reservada en cada espacio. Van
 * todos los espacios, también los que no se usaron: esos son los que hay que
 * mirar, y antes no aparecían.
 */
type FiltrarId = (id: number) => void;

/** Props de clic y clases para una fila que filtra. */
function fila(etiqueta: string, accion: (() => void) | null, base = '') {
  const { className, ...props } = filtrable(etiqueta, accion);
  return { ...props, className: `${base} ${className ? `${HOVER_FILTRO} -mx-1 px-1` : ''}` };
}

export function OcupacionEspacios({ filas, onFiltrar }: Readonly<{ filas: OcupacionEspacio[]; onFiltrar?: FiltrarId }>) {
  if (filas.length === 0) return <Vacio />;
  const maximo = Math.max(1, ...filas.map((o) => Number(o.porcentaje)));
  return (
    <ul className="space-y-2.5">
      {filas.map((o) => {
        const pct = Number(o.porcentaje);
        const sinUso = Number(o.reservas) === 0;
        return (
          <li key={o.espacioId} {...fila(o.espacioNombre, onFiltrar ? () => onFiltrar(o.espacioId) : null, 'py-0.5')}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                {o.espacioNombre}
                {o.edificioNombre && <span className="text-xs text-muted-foreground"> · {o.edificioNombre}</span>}
              </span>
              {sinUso ? (
                <span className="shrink-0 rounded bg-utec-orange/12 px-1.5 py-0.5 text-2xs font-medium text-marca-naranja-texto">sin uso</span>
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {n(o.reservas)} res. · {horas(Number(o.horasReservadas))} · <b className="text-foreground">{Math.round(pct)}%</b>
                </span>
              )}
            </div>
            {/* Relativa al más ocupado: con 14 h por día un 35% ya es mucho y llenaba un tercio de barra. */}
            <Barra porcentaje={(pct / maximo) * 100} clase="bg-utec-green" />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Los cinco espacios con menos ocupación, del menos usado al más: los que
 * pueden absorber demanda o no se justifican. En la lista completa quedaban
 * al fondo de un scroll.
 */
export function MenosUsados({ filas, cantidad = 5, onFiltrar }: Readonly<{ filas: OcupacionEspacio[]; cantidad?: number; onFiltrar?: FiltrarId }>) {
  if (filas.length === 0) return <Vacio />;
  const menos = [...filas].sort((a, b) => Number(a.porcentaje) - Number(b.porcentaje)).slice(0, cantidad);
  return (
    <ul className="divide-y divide-border/60">
      {menos.map((o) => {
        const sinUso = Number(o.reservas) === 0;
        return (
          <li key={o.espacioId} {...fila(o.espacioNombre, onFiltrar ? () => onFiltrar(o.espacioId) : null, 'flex items-baseline justify-between gap-2 py-1.5 text-sm')}>
            <span className="min-w-0 truncate">
              {o.espacioNombre}
              {o.edificioNombre && <span className="text-xs text-muted-foreground"> · {o.edificioNombre}</span>}
            </span>
            <span className={`shrink-0 tabular-nums ${sinUso ? 'font-semibold text-marca-naranja-texto' : 'text-muted-foreground'}`}>
              {sinUso ? 'sin uso' : `${Math.round(Number(o.porcentaje))}% · ${n(o.reservas)} res.`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Por carrera. "Sin carrera" va aparte, al pie: en los datos es casi la mitad
 * de las reservas y encabezando la tabla tapaba a las carreras de verdad.
 * La cancelación se marca sólo cuando se aparta.
 */
export function PorCarrera({ filas, onFiltrar }: Readonly<{ filas: ResumenCarrera[]; onFiltrar?: FiltrarId }>) {
  const sinCarrera = filas.find((c) => c.carreraId == null);
  const carreras = filas
    .filter((c) => c.carreraId != null)
    .sort((a, b) => Number(b.aprobadas) + Number(b.canceladas) - (Number(a.aprobadas) + Number(a.canceladas)));
  if (carreras.length === 0 && !sinCarrera) return <Vacio />;

  const totalReservas = filas.reduce((a, c) => a + Number(c.aprobadas) + Number(c.canceladas) + Number(c.pendientes), 0);

  return (
    <div>
      {/* En celular la tabla scrollea de costado en vez de cortar la última columna. */}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[440px] text-sm">
        <thead className="text-2xs uppercase tracking-wide text-muted-foreground">
          <tr className="border-b">
            <th className="py-2 pr-2 text-left font-medium">Carrera</th>
            <th className="px-2 py-2 text-right font-medium">Aprobadas</th>
            <th className="px-2 py-2 text-right font-medium">Canceladas</th>
            <th className="px-2 py-2 text-right font-medium" title="Canceladas con menos de 24 h de aviso">Tarde</th>
            <th className="py-2 pl-2 text-right font-medium">Cancelación</th>
          </tr>
        </thead>
        <tbody>
          {carreras.map((c) => {
            const tasa = Number(c.tasaCancelacion);
            return (
              <tr
                key={c.carreraId}
                {...filtrable(c.carreraNombre, onFiltrar && c.carreraId != null ? () => onFiltrar(c.carreraId!) : null)}
                className={`border-b border-border/60 last:border-0 ${onFiltrar ? 'cursor-pointer transition-colors hover:bg-muted/60' : ''}`}
              >
                <td className="max-w-[240px] truncate py-1.5 pr-2" title={c.carreraNombre}>{c.carreraNombre}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{n(c.aprobadas)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">{n(c.canceladas)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">{n(c.canceladasTarde)}</td>
                <td className="py-1.5 pl-2 text-right tabular-nums">
                  <span className={tasa > 15 ? 'rounded bg-utec-red/12 px-1.5 py-0.5 font-semibold text-marca-rojo-texto' : ''}>{tasa.toFixed(1)}%</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      {sinCarrera && (
        <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Además, <b className="text-foreground">{n(Number(sinCarrera.aprobadas) + Number(sinCarrera.canceladas) + Number(sinCarrera.pendientes))}</b> reservas
          ({totalReservas > 0 ? Math.round(((Number(sinCarrera.aprobadas) + Number(sinCarrera.canceladas) + Number(sinCarrera.pendientes)) / totalReservas) * 100) : 0}%)
          no tienen carrera asociada. Cancelan el {Number(sinCarrera.tasaCancelacion).toFixed(1)}%.
        </p>
      )}
    </div>
  );
}

export function QuienesMasReservan({ filas, onFiltrarRol }: Readonly<{ filas: TopUsuario[]; onFiltrarRol?: (rol: string) => void }>) {
  if (filas.length === 0) return <Vacio />;
  const maximo = Math.max(...filas.map((u) => Number(u.cantReservas)));
  return (
    <ol className="space-y-2.5">
      {filas.map((u, i) => {
        const total = Number(u.cantReservas);
        return (
          <li key={u.usuarioId} className="flex items-center gap-3">
            <span className="w-5 text-right text-xs text-muted-foreground tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-medium">{u.nombre}</span>
                  <span
                    {...filtrable(nombreRol(u.rol), onFiltrarRol ? () => onFiltrarRol(u.rol) : null)}
                    className={`ml-1.5 rounded bg-muted px-1.5 py-0.5 text-2xs uppercase tracking-wide text-muted-foreground ${onFiltrarRol ? 'cursor-pointer hover:bg-utec-orange/15 hover:text-marca-naranja-texto' : ''}`}
                  >
                    {nombreRol(u.rol)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{n(total)}</span>
              </div>
              <div className="mb-1 flex justify-between gap-2 text-2xs text-muted-foreground">
                <span className="truncate">{u.email}</span>
                <span className="shrink-0 tabular-nums">
                  {n(u.aprobadas)} aprobadas · {n(u.canceladas)} canceladas
                </span>
              </div>
              <Barra porcentaje={maximo > 0 ? (total / maximo) * 100 : 0} clase="bg-utec-yellow" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
