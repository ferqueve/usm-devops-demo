import { useMemo, useState } from 'react';
import datos from './_inventario.json';

/**
 * Tablero de cobertura del catálogo.
 *
 * La lista sale de `scripts/inventario-ui.mjs`, que recorre el proyecto y
 * marca como cubierto lo que las secciones de /ui importan de verdad. Nadie
 * anota nada a mano: si se agrega una pantalla y no se pone acá, aparece como
 * pendiente sola.
 *
 * No todo tiene que estar. Una ruta no es una primitiva, y algo que pide datos
 * al montarse ataría el catálogo a que el backend esté vivo. Lo que importa es
 * que el motivo esté escrito y que ninguna ausencia pase desapercibida.
 */

type Fila = (typeof datos)['inventario'][number];

const ETIQUETA: Record<string, { nombre: string; nota: string }> = {
  montable: { nombre: 'Montable', nota: 'Puede vivir en el catálogo.' },
  datos: { nombre: 'Pide datos', nota: 'Se monta llamando al backend.' },
  pantalla: { nombre: 'Pantalla', nota: 'Es una ruta entera.' },
  chrome: { nombre: 'Estructura', nota: 'Arma la pantalla; se ve en cualquier ruta.' },
  shadcn: { nombre: 'shadcn', nota: 'Primitiva de librería sin cambios propios.' },
};

function Barra({ hechos, total }: Readonly<{ hechos: number; total: number }>) {
  const pct = total === 0 ? 0 : Math.round((hechos / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-2xs tabular-nums text-muted-foreground">
        {hechos}/{total}
      </span>
    </div>
  );
}

export function Inventario() {
  const [soloPendientes, setSoloPendientes] = useState(false);
  const filas = datos.inventario as Fila[];

  const porFamilia = useMemo(() => {
    const mapa = new Map<string, Fila[]>();
    for (const f of filas) {
      if (!mapa.has(f.familia)) mapa.set(f.familia, []);
      mapa.get(f.familia)!.push(f);
    }
    return [...mapa.entries()]
      .map(([familia, items]) => {
        const montables = items.filter((i) => i.tipo === 'montable');
        return {
          familia,
          items,
          montables: montables.length,
          hechos: montables.filter((i) => i.cubierto).length,
        };
      })
      .sort((a, b) => b.montables - a.montables || a.familia.localeCompare(b.familia));
  }, [filas]);

  const montables = filas.filter((f) => f.tipo === 'montable');
  const hechos = montables.filter((f) => f.cubierto).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card p-4">
        <div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {hechos}
            <span className="text-base font-normal text-muted-foreground"> / {montables.length}</span>
          </p>
          <p className="text-xs text-muted-foreground">montables en el catálogo</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {(['datos', 'pantalla', 'chrome', 'shadcn'] as const).map((t) => (
            <div key={t}>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {filas.filter((f) => f.tipo === t).length}
              </p>
              <p className="text-2xs text-muted-foreground">{ETIQUETA[t].nombre}</p>
            </div>
          ))}
        </div>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={soloPendientes}
            onChange={(e) => setSoloPendientes(e.target.checked)}
            className="size-3.5 accent-[var(--primary)]"
          />
          Sólo pendientes
        </label>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {porFamilia.map(({ familia, items, montables: m, hechos: h }) => {
          const visibles = soloPendientes
            ? items.filter((i) => i.tipo === 'montable' && !i.cubierto)
            : items;
          if (visibles.length === 0) return null;
          return (
            <div key={familia} className="min-w-0 rounded-lg border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="truncate text-xs font-semibold text-foreground">{familia}</p>
                {m > 0 && <Barra hechos={h} total={m} />}
              </div>
              <ul className="space-y-0.5">
                {visibles.map((i) => (
                  <li key={i.archivo} className="flex items-baseline gap-2 text-2xs">
                    <span
                      className={
                        i.tipo !== 'montable'
                          ? 'text-muted-foreground/50'
                          : i.cubierto
                            ? 'text-utec-green'
                            : 'text-utec-orange'
                      }
                      title={i.tipo === 'montable' ? (i.cubierto ? 'en el catálogo' : 'pendiente') : ETIQUETA[i.tipo]?.nota}
                      aria-hidden
                    >
                      {i.tipo !== 'montable' ? '–' : i.cubierto ? '✓' : '○'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-foreground/80" title={i.archivo}>
                      {i.nombres.join(', ')}
                    </span>
                    {i.dialog && (
                      <span className="shrink-0 rounded bg-muted px-1 text-2xs text-muted-foreground">
                        diálogo
                      </span>
                    )}
                    {i.tipo !== 'montable' && (
                      <span className="shrink-0 text-2xs text-muted-foreground/70">
                        {ETIQUETA[i.tipo]?.nombre}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-2xs text-muted-foreground">
        Generado el {datos.generado} con <code className="font-mono">node scripts/inventario-ui.mjs</code>.
        Correrlo de nuevo después de agregar componentes.
      </p>
    </div>
  );
}
