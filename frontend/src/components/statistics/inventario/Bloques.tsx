import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import type { EstadoInventario, GrupoInventario } from '@/lib/api/stats';
import { porcentaje } from '../reservas/formato';

const n = (v: number) => v.toLocaleString('es-UY');

/**
 * Proporción de estados de un grupo en una barra fina. El color va con el
 * número al lado (en el globo y en las columnas), no solo.
 */
function BarraEstados({ g }: Readonly<{ g: GrupoInventario }>) {
  if (g.items === 0) return <div className="h-1.5 rounded-full bg-muted" />;
  const pct = (v: number) => `${(v / g.items) * 100}%`;
  return (
    <div
      className="flex h-1.5 gap-px overflow-hidden rounded-full bg-muted"
      title={`${g.disponibles} disponibles · ${g.mantenimiento} en mantenimiento · ${g.danados} dañados`}
    >
      <div className="bg-utec-green" style={{ width: pct(g.disponibles) }} />
      <div className="bg-utec-yellow" style={{ width: pct(g.mantenimiento) }} />
      <div className="bg-utec-red" style={{ width: pct(g.danados) }} />
    </div>
  );
}

/**
 * Tabla por tipo o por espacio. Reúne lo que antes eran cuatro bloques
 * (top 10, con más problemas, detalle completo, sin inventario): todos los
 * del alcance, los vacíos al final y marcados.
 */
export function TablaGrupos({ grupos, columna, conDetalle = false }: Readonly<{
  grupos: GrupoInventario[];
  columna: string;
  conDetalle?: boolean;
}>) {
  if (grupos.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nada para mostrar con estos filtros.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10 bg-card text-[11px] uppercase tracking-wide text-muted-foreground">
        <tr className="border-b">
          <th className="px-3 py-2 text-left font-medium">{columna}</th>
          <th className="px-2 py-2 text-right font-medium">Items</th>
          <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">Unidades</th>
          <th className="w-[24%] px-3 py-2 text-left font-medium">Estado</th>
          <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Problemas</th>
        </tr>
      </thead>
      <tbody>
        {grupos.map((g) => {
          const problemas = g.mantenimiento + g.danados;
          return (
            <tr key={g.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
              <td className="px-3 py-1.5">
                <div className={g.items === 0 ? 'text-muted-foreground' : ''}>{g.nombre}</div>
                {conDetalle && g.detalle && <div className="text-[11px] text-muted-foreground">{g.detalle}</div>}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">{g.items === 0 ? <span className="text-xs text-muted-foreground">vacío</span> : n(g.items)}</td>
              <td className="hidden px-2 py-1.5 text-right tabular-nums text-muted-foreground sm:table-cell">{g.items === 0 ? '' : n(g.unidades)}</td>
              <td className="px-3 py-1.5"><BarraEstados g={g} /></td>
              <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">
                {problemas > 0 ? (
                  <span className="font-semibold text-utec-red">
                    {problemas} <span className="text-xs font-normal text-muted-foreground">· {porcentaje(problemas, g.items)}%</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Lo que hay que ir a mirar: items en mantenimiento o dañados, el más estancado primero. */
export function Atencion({ items }: Readonly<{ items: EstadoInventario['atencion'] }>) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <CheckCircle2 className="h-8 w-8 text-utec-green" />
        <p className="text-sm font-medium">Todo el inventario está disponible</p>
        <p className="text-xs text-muted-foreground">No hay items en mantenimiento ni dañados con estos filtros.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border/60">
      {items.map((i) => {
        const danado = i.estado === 'DANADO';
        return (
          <li key={i.id} className="flex items-start gap-3 py-2">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${danado ? 'bg-utec-red/12 text-utec-red' : 'bg-utec-yellow/20 text-[#9a6b00] dark:text-utec-yellow'}`}>
              {danado ? <AlertTriangle className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {i.tipo}
                  {i.cantidad > 1 && <span className="font-normal text-muted-foreground"> × {i.cantidad}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {i.diasSinCambios === 0 ? 'hoy' : `hace ${i.diasSinCambios} d`}
                </span>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                <span className={danado ? 'text-utec-red' : ''}>{danado ? 'Dañado' : 'En mantenimiento'}</span>
                {' · '}
                {i.espacio ?? 'sin espacio asignado'}
                {i.observaciones && ` · ${i.observaciones}`}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Qué hay en cada espacio, por tipo, con los filtros aplicados. */
export function Matriz({ estado }: Readonly<{ estado: EstadoInventario }>) {
  const { valores, maximo, espacios, tipos } = useMemo(() => {
    const m = new Map<string, number>();
    let max = 0;
    for (const c of estado.matriz) {
      m.set(`${c.espacioId}-${c.tipoId}`, c.items);
      max = Math.max(max, c.items);
    }
    const tiposConItems = new Set(estado.matriz.map((c) => c.tipoId));
    return {
      valores: m,
      maximo: max,
      espacios: estado.porEspacio.filter((e) => e.items > 0),
      tipos: estado.porTipo.filter((t) => tiposConItems.has(t.id)),
    };
  }, [estado]);

  if (espacios.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No hay inventario asignado a espacios con estos filtros.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-[3px] text-[11px]" style={{ minWidth: 160 + tipos.length * 56 }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-[160px] bg-card pr-2 text-left font-medium text-muted-foreground">Espacio</th>
            {tipos.map((t) => (
              <th key={t.id} title={t.nombre} className="px-1 pb-1 text-center align-bottom font-medium text-muted-foreground">
                <div className="mx-auto max-w-[76px] truncate">{t.nombre}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {espacios.map((e) => (
            <tr key={e.id}>
              <td className="sticky left-0 z-10 max-w-[150px] truncate bg-card pr-2 font-medium text-muted-foreground" title={e.nombre}>
                {e.nombre}
              </td>
              {tipos.map((t) => {
                const valor = valores.get(`${e.id}-${t.id}`) ?? 0;
                const intensidad = maximo > 0 ? valor / maximo : 0;
                return (
                  <td
                    key={t.id}
                    title={`${e.nombre} · ${t.nombre}: ${valor} items`}
                    className={`h-8 rounded text-center align-middle tabular-nums ${valor === 0 ? 'bg-muted/60' : ''}`}
                    style={
                      valor === 0
                        ? undefined
                        : {
                            backgroundColor: `rgba(31, 85, 171, ${0.14 + intensidad * 0.86})`,
                            color: intensidad > 0.45 ? '#ffffff' : 'var(--foreground)',
                          }
                    }
                  >
                    {valor || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
