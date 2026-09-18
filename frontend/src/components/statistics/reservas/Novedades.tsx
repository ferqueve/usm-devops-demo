import { ArrowDownRight, ArrowUpRight, Building2, Clock, DoorOpen, GraduationCap, Sparkles, Timer, UserRound, type LucideIcon } from 'lucide-react';
import type { FiltrosReservas, Novedad } from '@/lib/api/stats';
import { filtrable } from '../graficos/filtrable';
import { useTemaGraficos } from '../graficos/tema';
import { demora, nombreRolPlural } from './formato';
import { filtroDeNovedad } from './filtros';

const ICONOS: Record<string, LucideIcon> = {
  espacio: DoorOpen,
  carrera: GraduationCap,
  rol: UserRound,
  edificio: Building2,
  hora: Clock,
  aprobacion: Timer,
};

const METRICAS: Record<string, string> = {
  ocupacion: 'Ocupación',
  cancelacion: 'Cancelación',
  tasaCancelacion: 'Cancelación',
  reservas: 'Reservas',
  aprobadas: 'Reservas aprobadas',
  horaPico: 'Hora pico',
  hora: 'Hora pico',
  respuesta: 'Tiempo de respuesta',
  medianaRespuesta: 'Tiempo de respuesta',
  tiempoRespuesta: 'Tiempo de respuesta',
};

function metrica(n: Novedad): string {
  if (METRICAS[n.metrica]) return METRICAS[n.metrica];
  if (n.tipo === 'hora') return 'Hora pico';
  if (n.tipo === 'aprobacion') return 'Tiempo de respuesta';
  return n.metrica.charAt(0).toUpperCase() + n.metrica.slice(1);
}

function valor(n: Novedad, v: number): string {
  if (n.unidad === 'pp') return `${Math.round(v)}%`;
  if (n.unidad === 'h') return demora(v);
  return Math.round(v).toLocaleString('es-UY');
}

function cambio(n: Novedad): string {
  const signo = n.cambio > 0 ? '+' : n.cambio < 0 ? '−' : '';
  const abs = Math.abs(n.cambio);
  if (n.unidad === 'pp') return `${signo}${Math.round(abs)} pp`;
  if (n.unidad === 'h') return `${signo}${demora(abs)}`;
  return `${signo}${abs > 999 ? '999+' : Math.round(abs)}%`;
}


/** Largo de la barra: contra el mayor de los dos, o sobre 100 si son porcentajes. */
function escala(n: Novedad, v: number): number {
  const tope = n.unidad === 'pp' ? Math.max(100 / 2, n.antes, n.ahora) : Math.max(n.antes, n.ahora);
  return tope > 0 ? Math.max(2, (Math.max(0, v) / tope) * 100) : 0;
}

function titulo(n: Novedad): string {
  return n.tipo === 'rol' ? nombreRolPlural(n.titulo) : n.titulo;
}

interface Props {
  novedades: Novedad[] | null;
  /** "el período anterior (17 mar al 14 jun)". */
  contra: string;
  onFiltrar: (f: FiltrosReservas) => void;
}

/**
 * Lo que más cambió contra el período de comparación, en tarjetas: qué, de
 * cuánto a cuánto, y si es para bien (verde), para mal (rojo) o sólo un
 * cambio (neutro). Lo que se puede filtrar, filtra con un clic.
 */
export function Novedades({ novedades, contra, onFiltrar }: Readonly<Props>) {
  const tema = useTemaGraficos();

  if (novedades == null) {
    return (
      <div className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
        No se pudieron cargar las novedades.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-chrome px-4 py-2.5 text-white">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-utec-yellow text-marca-tinta">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <h3 className="shrink-0 text-sm font-semibold">Novedades</h3>
          <span className="min-w-0 truncate text-xs text-white/60">lo que más cambió contra {contra}</span>
        </div>
      </div>
      {novedades.length === 0 ? (
        <div className="flex items-center justify-center gap-3 px-4 py-6 text-sm text-muted-foreground">
          <Sparkles className="h-5 w-5 text-utec-green" />
          Todo parecido: nada cambió lo suficiente como para destacarlo.
        </div>
      ) : (
        <ul className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          {novedades.slice(0, 6).map((n, i) => {
            const Icono = ICONOS[n.tipo] ?? Sparkles;
            const color = n.bueno == null ? tema.categorias[0] : n.bueno ? tema.positivo : tema.negativo;
            const sube = n.sentido === 'sube' || (n.sentido !== 'baja' && n.cambio > 0);
            const Flecha = sube ? ArrowUpRight : ArrowDownRight;
            const filtro = filtroDeNovedad(n);
            const { className: claseClic, ...clic } = filtrable(titulo(n), filtro ? () => onFiltrar(filtro) : null);
            const tono = n.bueno == null ? 'neutro' : n.bueno ? 'bueno' : 'malo';
            return (
              <li
                key={`${n.tipo}-${n.clave ?? i}-${n.metrica}`}
                {...clic}
                data-tono={tono}
                className={`group relative flex items-center gap-3 bg-card px-4 py-3 transition-colors ${filtro ? `${claseClic} hover:bg-muted/60` : ''}`}
              >
                <span className="absolute inset-y-2 left-0 w-1 rounded-r" style={{ backgroundColor: color }} aria-hidden />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1f`, color }}>
                  <Icono className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate text-sm font-semibold" title={titulo(n)}>{titulo(n)}</span>
                  </div>
                  <div className="truncate text-2xs uppercase tracking-wide text-muted-foreground">{metrica(n)}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm tabular-nums">
                    <span className="text-muted-foreground">{valor(n, n.antes)}</span>
                    <span className="text-muted-foreground">→</span>
                    <b>{valor(n, n.ahora)}</b>
                  </div>
                </div>
                <div className="flex w-[108px] shrink-0 flex-col items-end gap-1.5">
                  <span className="inline-flex items-center gap-0.5 text-lg font-bold leading-none tabular-nums" style={{ color }}>
                    <Flecha className="h-4 w-4" />
                    {cambio(n)}
                  </span>
                  {/* Antes y ahora a la misma escala: el largo dice cuánto cambió de verdad. */}
                  <div className="w-full space-y-[3px]" aria-hidden title={`antes ${valor(n, n.antes)} · ahora ${valor(n, n.ahora)}`}>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-foreground/25" style={{ width: `${escala(n, n.antes)}%` }} />
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${escala(n, n.ahora)}%`, backgroundColor: color }} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
