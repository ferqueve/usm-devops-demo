import { Clock, DoorOpen, XCircle } from 'lucide-react';
import type { ExternosReservas, OrganizadorExterno } from '@/lib/api/stats';
import { Medidor } from '../graficos/Medidor';
import { useTemaGraficos } from '../graficos/tema';
import { Vacio } from '../Vacio';
import { entero, horas, porcentaje } from './formato';

/** "26,5 h": en la tabla, "26 h 30 min" partía la columna en dos renglones. */
const horasCortas = (v: number) => `${Number(v).toLocaleString('es-UY', { maximumFractionDigits: 1 })} h`;

/** Cuánto piden los de afuera y cuánto se les aprueba. */
export function ResumenExternos({ datos, grande = false }: Readonly<{ datos: ExternosReservas; grande?: boolean }>) {
  const orgs = datos.organizadores;
  if (Number(datos.total) === 0 && orgs.length === 0) return <Vacio texto="No hubo eventos de organizadores externos." />;
  const eventos = orgs.reduce((a, o) => a + Number(o.eventos), 0);
  const aprobadas = orgs.reduce((a, o) => a + Number(o.aprobadas), 0);
  const canceladas = orgs.reduce((a, o) => a + Number(o.canceladas), 0);
  const horasTotales = orgs.reduce((a, o) => a + Number(o.horas), 0);
  const cifras = [
    { icono: Clock, valor: horas(horasTotales), etiqueta: 'reservadas' },
    { icono: XCircle, valor: entero(canceladas), etiqueta: canceladas === 1 ? 'cancelado' : 'cancelados' },
    { icono: DoorOpen, valor: entero(orgs.length), etiqueta: orgs.length === 1 ? 'organizador' : 'organizadores' },
  ];
  return (
    <div className="space-y-4">
      <Medidor
        valor={porcentaje(aprobadas, eventos)}
        etiqueta="Se les aprueba"
        detalle={`${entero(aprobadas)} de ${entero(eventos)} pedidos`}
        umbrales={{ alerta: 50, aviso: 75 }}
        ancho={grande ? 240 : 170}
      />
      <div className="grid grid-cols-3 gap-2">
        {cifras.map((c) => (
          <div key={c.etiqueta} className="rounded-lg border bg-muted/30 px-2 py-2 text-center">
            <c.icono className="mx-auto mb-0.5 h-3.5 w-3.5 text-muted-foreground" />
            <div className="text-sm font-semibold tabular-nums">{c.valor}</div>
            <div className="text-2xs leading-tight text-muted-foreground">{c.etiqueta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter((p) => /^[\p{L}\d]/u.test(p) && p.length > 2)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || nombre.slice(0, 2).toUpperCase();
}

/**
 * Organizadores externos ordenados por pedidos. La barra (a escala del que
 * más pide) reparte aprobados, cancelados y el resto; al lado, horas
 * reservadas y cuántos espacios distintos usaron.
 */
export function OrganizadoresExternos({ filas }: Readonly<{ filas: OrganizadorExterno[] }>) {
  const tema = useTemaGraficos();
  if (filas.length === 0) return <Vacio texto="No hubo eventos de organizadores externos." />;
  const maximo = Math.max(1, ...filas.map((f) => Number(f.eventos)));
  const segmentos = [
    { nombre: 'Aprobados', color: tema.aprobadas },
    { nombre: 'Cancelados', color: tema.canceladas },
    { nombre: 'Pendientes', color: tema.pendientes },
  ];
  return (
    <div>
      <div className="mb-2 hidden grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_70px_64px] gap-3 border-b pb-1.5 text-2xs uppercase tracking-wide text-muted-foreground sm:grid">
        <span>Organizador</span>
        <span>Pedidos</span>
        <span className="text-right">Horas</span>
        <span className="text-right">Espacios</span>
      </div>
      <ol className="space-y-2.5">
        {filas.map((f, i) => {
          const eventos = Number(f.eventos);
          const aprobadas = Number(f.aprobadas);
          const canceladas = Number(f.canceladas);
          const resto = Math.max(0, eventos - aprobadas - canceladas);
          const valores = [aprobadas, canceladas, resto];
          return (
            <li key={f.organizador} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_70px_64px]">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-bold text-white"
                  style={{ backgroundColor: tema.categorias[i % tema.categorias.length] }}
                  aria-hidden
                >
                  {iniciales(f.organizador)}
                </span>
                <span className="truncate text-sm font-medium" title={f.organizador}>{f.organizador}</span>
              </div>
              <div className="col-span-2 row-start-2 flex items-center gap-2 sm:col-span-1 sm:row-start-auto">
                <div
                  className="flex h-3 gap-[2px] overflow-hidden rounded"
                  style={{ width: `${Math.max(4, (eventos / maximo) * 100)}%` }}
                  title={segmentos.map((s, k) => `${s.nombre}: ${valores[k]}`).join(' · ')}
                >
                  {segmentos.map((s, k) => (valores[k] > 0 ? <div key={s.nombre} style={{ flexGrow: valores[k], backgroundColor: s.color }} /> : null))}
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  <b className="text-foreground">{entero(eventos)}</b> · {porcentaje(aprobadas, eventos)}%
                </span>
              </div>
              <span className="text-right text-xs tabular-nums text-muted-foreground sm:text-sm">
                <span className="sm:hidden">{horasCortas(Number(f.horas))} · {entero(Number(f.espacios))} esp.</span>
                <span className="hidden whitespace-nowrap sm:inline">{horasCortas(Number(f.horas))}</span>
              </span>
              <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:inline">{entero(Number(f.espacios))}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segmentos.map((s) => (
          <span key={s.nombre} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.nombre}
          </span>
        ))}
      </div>
    </div>
  );
}
