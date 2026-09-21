import { CheckCircle2 } from 'lucide-react';
import type { PrediccionInventario, TipoInventarioML } from '@/lib/api/stats';
import { Medidor } from '@/components/statistics/graficos/Medidor';
import { useColores } from '../colores';
import { Dato } from '../comunes';
import { decimal, fechaCorta } from '../formato';
import { variabilidad } from './estilos';

function Barras({ modelo, referencia, maximo, fuerte }: Readonly<{ modelo: number | null; referencia: number | null; maximo: number; fuerte?: boolean }>) {
  const colores = useColores();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_40px] items-center gap-x-2 gap-y-1 text-2xs tabular-nums">
      <div className={`${fuerte ? 'h-2.5' : 'h-2'} overflow-hidden rounded-full bg-muted`}>
        <div className="h-full rounded-full" style={{ width: `${((modelo ?? 0) / maximo) * 100}%`, backgroundColor: colores.prediccion }} />
      </div>
      <span className="text-right font-semibold">{modelo == null ? '—' : `${decimal(modelo, 0)}%`}</span>
      <div className={`${fuerte ? 'h-2.5' : 'h-2'} overflow-hidden rounded-full bg-muted`}>
        <div className="h-full rounded-full" style={{ width: `${((referencia ?? 0) / maximo) * 100}%`, backgroundColor: colores.referencia }} />
      </div>
      <span className="text-right text-muted-foreground">{referencia == null ? '—' : `${decimal(referencia, 0)}%`}</span>
    </div>
  );
}

/**
 * El error de validación de cada tipo contra la referencia justa (repetir la
 * última semana antes del período apartado). Primero el total, después los
 * tipos de mejor a peor, y al final los que no se modelaron.
 */
export function ErrorPorTipo({ modelo, tipos }: Readonly<{ modelo: PrediccionInventario['modelo']; tipos: TipoInventarioML[] }>) {
  const colores = useColores();
  const modelados = tipos.filter((t) => t.status === 'ok').sort((a, b) => (a.wape ?? Infinity) - (b.wape ?? Infinity));
  const omitidos = tipos.filter((t) => t.status === 'omitido');
  const maximo = Math.max(1, modelo.wape ?? 0, modelo.wapeIngenuo ?? 0, ...modelados.flatMap((t) => [t.wape ?? 0, t.wapeIngenuo ?? 0])) * 1.05;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[minmax(0,110px)_minmax(0,1fr)_18px] items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
        <span className="text-sm font-semibold">Todos</span>
        <Barras modelo={modelo.wape ?? null} referencia={modelo.wapeIngenuo ?? null} maximo={maximo} fuerte />
        {modelo.wape != null && modelo.wapeIngenuo != null && modelo.wape < modelo.wapeIngenuo && <CheckCircle2 className="h-4 w-4" style={{ color: colores.reservadas }} aria-label="le gana a la referencia" />}
      </div>
      <ul className="space-y-2.5 px-3">
        {modelados.map((t) => {
          const gana = t.wape != null && t.wapeIngenuo != null && t.wape < t.wapeIngenuo;
          return (
            <li key={t.tipoElementoId} className="grid grid-cols-[minmax(0,110px)_minmax(0,1fr)_18px] items-center gap-3">
              <span className="min-w-0">
                <span className="block truncate text-sm" title={t.nombre}>{t.nombre}</span>
                <span className="block text-2xs text-muted-foreground">variabilidad {variabilidad(t.alpha)}</span>
              </span>
              <Barras modelo={t.wape} referencia={t.wapeIngenuo} maximo={maximo} />
              {gana ? <CheckCircle2 className="h-4 w-4" style={{ color: colores.reservadas }} aria-label="le gana a la referencia" /> : <span />}
            </li>
          );
        })}
      </ul>
      {omitidos.length > 0 && (
        <p className="border-t px-3 pt-2 text-xs text-muted-foreground">
          Sin modelo por falta de pedidos: {omitidos.map((t) => t.nombre).join(', ')}.
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full" style={{ backgroundColor: colores.prediccion }} />modelo</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full" style={{ backgroundColor: colores.referencia }} />repetir la última semana</span>
        <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: colores.reservadas }} />le gana</span>
      </div>
    </div>
  );
}

/** El modelo en pocas palabras, con la precisión como medidor. */
export function ComoFunciona({ modelo, grande = false }: Readonly<{ modelo: PrediccionInventario['modelo']; grande?: boolean }>) {
  const precision = modelo.wape == null ? null : Math.max(0, 100 - modelo.wape);
  return (
    <div className="space-y-4">
      <Medidor
        valor={precision ?? 0}
        etiqueta="Precisión"
        detalle={modelo.wape == null ? 'sin validación' : `error de ${decimal(modelo.wape, 0)}% en el pico diario`}
        umbrales={{ alerta: 55, aviso: 70 }}
        ancho={grande ? 240 : 160}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        Aprende cuántas unidades de cada tipo se piden <b className="text-foreground">a la vez</b> según el día de la semana y la tendencia, y le suma la variabilidad
        de los días cargados. Con eso calcula, para cada día, la chance de pedir más de lo que hay.
      </p>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <Dato etiqueta="Modelo" valor="Binomial negativa" />
        <Dato etiqueta="Rango" valor={`${Math.round((modelo.intervalo ?? 0.8) * 100)}% de confianza`} />
        <Dato etiqueta="Histórico" valor={modelo.historicoDesde && modelo.historicoHasta ? `${fechaCorta(modelo.historicoDesde)} al ${fechaCorta(modelo.historicoHasta)}` : '—'} />
        <Dato etiqueta="Validación" valor={`últimos ${modelo.holdoutDias ?? 28} días`} />
      </dl>
    </div>
  );
}
