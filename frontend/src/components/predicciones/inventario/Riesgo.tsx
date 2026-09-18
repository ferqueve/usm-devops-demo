import { CalendarClock, PackageX } from 'lucide-react';
import type { TipoInventarioML } from '@/lib/api/stats';
import { MatrizCalor } from '@/components/statistics/graficos/MatrizCalor';
import { useTemaGraficos } from '@/components/statistics/graficos/tema';
import { Vacio } from '@/components/statistics/Vacio';
import { Chip } from '../comunes';
import { decimal, entero, fechaCorta, porcentaje01 } from '../formato';
import { comprometidasMax, estiloRiesgo } from './estilos';

/** "1 disponible", "3 disponibles". */
function disponibles(cantidad: number | null | undefined): string {
  return `${entero(cantidad)} ${cantidad === 1 ? 'disponible' : 'disponibles'}`;
}

/** Pico esperado contra stock en una barra: la marca oscura es lo que hay. */
function BarraStock({ t, color }: Readonly<{ t: TipoInventarioML; color: string }>) {
  const stock = t.stockDisponible ?? 0;
  const pico = t.picoEsperado ?? 0;
  const pedido = comprometidasMax(t);
  const escala = Math.max(1, stock, pico, pedido) * 1.12;
  return (
    <div className="relative h-3 rounded-full bg-muted" title={`Pico esperado ${decimal(pico)} · ya pedido ${entero(pedido)} · disponibles ${entero(stock)}`}>
      <div className="absolute inset-y-0 left-0 rounded-full opacity-35" style={{ width: `${(pedido / escala) * 100}%`, backgroundColor: color }} />
      <div className="absolute inset-y-[3px] left-0 rounded-full" style={{ width: `${(pico / escala) * 100}%`, backgroundColor: color }} />
      <div className="absolute -inset-y-1 w-[3px] -translate-x-1/2 rounded-full bg-foreground" style={{ left: `${(stock / escala) * 100}%` }} />
    </div>
  );
}

/**
 * Semáforo: una tarjeta por tipo, en el orden de riesgo que manda el servidor
 * (sin stock, alto, medio, bajo). Tocarla lleva al detalle del tipo.
 */
export function Semaforo({ tipos, elegido, onElegir }: Readonly<{
  tipos: TipoInventarioML[];
  elegido: number | null;
  onElegir: (id: number) => void;
}>) {
  const tema = useTemaGraficos();
  if (tipos.length === 0) return <Vacio texto="No hay tipos de elemento con pedidos." />;
  return (
    <div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {tipos.map((t) => {
          const estilo = estiloRiesgo(t.status === 'omitido' ? null : t.riesgo, tema);
          if (t.status === 'omitido') {
            return (
              <li key={t.tipoElementoId} className="flex flex-col justify-center rounded-lg border border-dashed bg-muted/30 px-3 py-2.5 text-muted-foreground">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">{t.nombre}</span>
                  <Chip color={estilo.color} icono={estilo.icono}>Omitido</Chip>
                </div>
                <p className="mt-1 text-xs leading-snug">{t.detalle ?? 'Muy pocos pedidos para modelarlo.'}</p>
              </li>
            );
          }
          const activo = t.tipoElementoId === elegido;
          return (
            <li key={t.tipoElementoId}>
              <button
                type="button"
                onClick={() => onElegir(t.tipoElementoId)}
                aria-pressed={activo}
                className={`relative flex w-full flex-col gap-2 overflow-hidden rounded-lg border bg-card py-2.5 pl-4 pr-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-utec-yellow/60 ${
                  activo ? 'ring-2 ring-utec-yellow' : ''
                }`}
              >
                <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: estilo.color }} aria-hidden />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{t.nombre}</div>
                    <div className="text-2xs text-muted-foreground tabular-nums">
                      {disponibles(t.stockDisponible)}{t.stockTotal != null && t.stockTotal !== t.stockDisponible ? ` de ${entero(t.stockTotal)}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold leading-none tabular-nums">{porcentaje01(t.probFaltanteMax)}</div>
                    <div className="text-2xs text-muted-foreground">prob. máx.</div>
                  </div>
                </div>
                <BarraStock t={t} color={estilo.color} />
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-2xs text-muted-foreground">
                  <Chip color={estilo.color} icono={estilo.icono}>{estilo.etiqueta}</Chip>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <CalendarClock className="h-3 w-3" />
                    pico {decimal(t.picoEsperado, 0)} el {t.fechaPico ? fechaCorta(t.fechaPico) : '—'}
                    {!!t.diasEnRiesgo && <b className="text-foreground"> · {t.diasEnRiesgo} {t.diasEnRiesgo === 1 ? 'día' : 'días'} en riesgo</b>}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-muted-foreground/70" />pico esperado</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-muted-foreground/30" />ya pedido</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-[3px] rounded-full bg-foreground" />disponibles hoy</span>
      </div>
    </div>
  );
}

/** Tipo × semana con la probabilidad máxima de faltante de cada semana. */
export function MatrizRiesgo({ tipos }: Readonly<{ tipos: TipoInventarioML[] }>) {
  const modelados = tipos.filter((t) => t.status === 'ok' && t.semanas?.length);
  if (modelados.length === 0) return <Vacio texto="No hay tipos modelados." />;
  const columnas = [...new Set(modelados.flatMap((t) => (t.semanas ?? []).map((s) => s.semana)))].sort();
  return (
    <MatrizCalor
      filas={modelados.map((t) => t.nombre)}
      columnas={columnas}
      etiquetaColumna={(c) => fechaCorta(String(c))}
      etiquetaMarca="lo ya pedido supera el stock"
      notaFila={(f) => {
        const t = modelados.find((m) => m.nombre === f);
        return t ? disponibles(t.stockDisponible) : undefined;
      }}
      celdas={modelados.flatMap((t) =>
        (t.semanas ?? []).map((s) => ({
          fila: t.nombre,
          columna: s.semana,
          valor: s.probFaltanteMax * 100,
          marca: t.stockDisponible != null && s.comprometidasMax > t.stockDisponible ? 1 : 0,
          detalle: `pico esperado ${decimal(s.picoEsperado)} · ya pedido ${entero(s.comprometidasMax)}`,
        })),
      )}
    />
  );
}

/** Aviso chico cuando algún tipo ya tiene pedido más de lo que hay. */
export function YaFalta({ tipos }: Readonly<{ tipos: TipoInventarioML[] }>) {
  const falta = tipos.filter((t) => t.status === 'ok' && t.stockDisponible != null && comprometidasMax(t) > t.stockDisponible);
  if (falta.length === 0) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-utec-red/30 bg-utec-red/10 px-4 py-2.5 text-sm">
      <PackageX className="mt-0.5 h-4 w-4 shrink-0 text-utec-red" />
      <span>
        <b>Ya no alcanza:</b> para algún día del horizonte ya está pedido más de lo disponible en{' '}
        {falta.map((t) => t.nombre).join(', ')}. Eso no es una predicción: hay que conseguir unidades o reprogramar.
      </span>
    </div>
  );
}
