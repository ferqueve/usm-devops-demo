import { ChevronRight, Wrench } from 'lucide-react';
import type { DemandaInventario, EquipoPorTipo } from '@/lib/api/stats';
import { Dona } from '../graficos/Dona';
import { Embudo } from '../graficos/Embudo';
import { filtrable, HOVER_FILTRO } from '../graficos/filtrable';
import { useTemaGraficos } from '../graficos/tema';
import { Vacio } from '../Vacio';
import { entero } from '../reservas/formato';

/** Del pedido a la entrega, y aparte cómo se reparten los estados. */
export function EmbudoEquipos({ totales, grande = false }: Readonly<{ totales: DemandaInventario['totales']; grande?: boolean }>) {
  const tema = useTemaGraficos();
  const t = {
    solicitudes: Number(totales.solicitudes),
    pendientes: Number(totales.pendientes),
    aprobadas: Number(totales.aprobadas),
    entregadas: Number(totales.entregadas),
    rechazadas: Number(totales.rechazadas),
  };
  if (t.solicitudes === 0) return <Vacio texto="Ninguna reserva del período pidió equipos." />;
  const resueltas = t.aprobadas + t.entregadas + t.rechazadas;
  return (
    <div className={grande ? 'grid items-center gap-8 md:grid-cols-2' : 'space-y-4'}>
      <Embudo
        etapas={[
          { nombre: 'Pedidas', valor: t.solicitudes, color: '#6d28d9' },
          { nombre: 'Resueltas', valor: resueltas, color: '#8b5cf6' },
          { nombre: 'Aprobadas', valor: t.aprobadas + t.entregadas, color: tema.aprobadas },
          { nombre: 'Entregadas', valor: t.entregadas, color: tema.categorias[1] },
        ]}
      />
      <div className={grande ? '' : 'border-t pt-3'}>
        <Dona
          tamano={grande ? 200 : 110}
          leyendaCentro="pedidos"
          porciones={[
            { nombre: 'Pendientes', valor: t.pendientes, color: tema.pendientes },
            { nombre: 'Aprobadas', valor: t.aprobadas, color: tema.aprobadas },
            { nombre: 'Entregadas', valor: t.entregadas, color: tema.categorias[1] },
            { nombre: 'Rechazadas', valor: t.rechazadas, color: tema.canceladas },
          ]}
        />
      </div>
    </div>
  );
}

type Severidad = 'sin' | 'falta' | 'justo' | 'alcanza';

function severidad(pico: number, disponibles: number, enInventario: number): Severidad {
  if (enInventario <= 0) return 'sin';
  if (pico > disponibles * 1.5 || (disponibles === 0 && pico > 0)) return 'falta';
  if (pico > disponibles) return 'justo';
  return 'alcanza';
}

const SEVERIDADES: Record<Severidad, { chip: string; clase: string; orden: number }> = {
  sin: { chip: 'No hay en inventario', clase: 'bg-muted text-muted-foreground', orden: 0 },
  falta: { chip: 'No alcanza', clase: 'bg-utec-red/12 text-utec-red', orden: 1 },
  justo: { chip: 'Algún día faltó', clase: 'bg-utec-orange/12 text-utec-orange', orden: 2 },
  alcanza: { chip: 'Alcanza', clase: 'bg-utec-green/15 text-[#4d7a22] dark:text-utec-green', orden: 3 },
};

const plural = (n: number, uno: string, varios: string) => `${entero(n)} ${n === 1 ? uno : varios}`;

/**
 * Por tipo de equipo, dos números que se comparan de un vistazo: el día que
 * más se pidió contra lo que hay disponible, con dos barras en la misma
 * escala, cuántas veces se pasa y un chip de severidad. Primero lo que no
 * alcanza.
 */
export function PedidoVsDisponible({ filas, limite }: Readonly<{ filas: EquipoPorTipo[]; limite?: number }>) {
  const tema = useTemaGraficos();
  if (filas.length === 0) return <Vacio texto="Ninguna reserva del período pidió equipos." />;
  const conSeveridad = filas
    .map((f) => {
      const pico = Number(f.maxUnidadesDia);
      const disp = Number(f.disponibles);
      const inv = Number(f.enInventario);
      return { f, pico, disp, inv, sev: severidad(pico, disp, inv) };
    })
    .sort((a, b) => SEVERIDADES[a.sev].orden - SEVERIDADES[b.sev].orden || b.pico / Math.max(1, b.disp) - a.pico / Math.max(1, a.disp));
  const noAlcanzan = conSeveridad.filter((x) => x.sev === 'falta' || x.sev === 'sin').length;
  const visibles = conSeveridad.slice(0, limite);
  const color = (sev: Severidad) => (sev === 'alcanza' ? tema.disponible : sev === 'justo' ? tema.mantenimiento : tema.danado);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          <b className="text-foreground">{noAlcanzan}</b> de {filas.length} tipos no alcanzan o no están en inventario
        </span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm" style={{ backgroundColor: tema.danado }} />pico pedido</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-foreground/35" />disponible</span>
        </span>
      </div>
      <ul className="space-y-3">
        {visibles.map(({ f, pico, disp, inv, sev }) => {
          const escala = Math.max(1, pico, disp);
          const veces = disp > 0 ? pico / disp : null;
          return (
            <li key={f.tipoElementoId} data-severidad={sev}>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium" title={`${f.nombre} · ${entero(Number(f.solicitudes))} pedidos`}>{f.nombre}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${SEVERIDADES[sev].clase}`}>
                  {sev === 'falta' && veces != null && veces >= 2 ? `${Math.round(veces)}× lo que hay` : SEVERIDADES[sev].chip}
                </span>
              </div>
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_104px] items-center gap-x-2 gap-y-0.5 text-[11px] tabular-nums">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${(pico / escala) * 100}%`, backgroundColor: color(sev) }} />
                </div>
                <span className="text-muted-foreground">
                  pico <b className="text-foreground">{entero(pico)}</b>/día
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground/35" style={{ width: `${(disp / escala) * 100}%` }} />
                </div>
                <span className="text-muted-foreground">
                  {inv <= 0 ? 'sin inventario' : <>hay <b className="text-foreground">{plural(disp, 'disponible', 'disponibles')}</b></>}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {limite != null && filas.length > limite && (
        <p className="mt-3 border-t pt-2 text-center text-xs text-muted-foreground">
          Y {filas.length - limite} tipos más: ampliá para verlos todos.
        </p>
      )}
    </div>
  );
}

/**
 * Espacios con equipos rotos o en arreglo que igual se siguen reservando. Un
 * clic filtra el estado del inventario por ese espacio y lleva hasta ahí.
 */
export function EspaciosConProblemas({ filas, onVerEstado }: Readonly<{ filas: DemandaInventario['espaciosConProblemas']; onVerEstado?: (espacioId: number) => void }>) {
  if (filas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <Wrench className="h-7 w-7 text-utec-green" />
        Ningún espacio reservado tiene inventario con problemas.
      </div>
    );
  }
  const maximo = Math.max(1, ...filas.map((f) => Number(f.reservas)));
  return (
    <ul className="divide-y divide-border/60">
      {filas.map((f) => {
        const { className: claseClic, ...clic } = filtrable(f.nombre, onVerEstado ? () => onVerEstado(f.espacioId) : null);
        return (
          <li key={f.espacioId} className="flex items-center gap-3 py-2">
            <div {...clic} className={`-mx-1 min-w-0 flex-1 px-1 ${claseClic ? `${HOVER_FILTRO} ${claseClic}` : ''}`}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{f.nombre}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{entero(Number(f.reservas))} reservas</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-utec-purple" style={{ width: `${(Number(f.reservas) / maximo) * 100}%` }} />
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded bg-utec-orange/12 px-1.5 py-0.5 text-xs font-semibold text-utec-orange" title="Items en mantenimiento o dañados">
              <Wrench className="h-3 w-3" />
              {entero(Number(f.itemsConProblema))}
            </span>
            {onVerEstado && (
              <button
                type="button"
                onClick={() => onVerEstado(f.espacioId)}
                className="inline-flex shrink-0 items-center rounded-md px-1.5 py-1 text-xs font-medium text-utec-blue hover:bg-muted dark:text-sky-400"
                title={`Ver el estado del inventario de ${f.nombre}`}
              >
                ver estado
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
