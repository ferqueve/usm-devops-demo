import { ArrowDownRight, ArrowUpRight, Equal } from 'lucide-react';
import type { FactorAsistencia } from '@/lib/api/stats';
import { BarrasDivergentes } from '@/components/statistics/graficos/BarrasDivergentes';
import { useTemaGraficos } from '@/components/statistics/graficos/tema';
import { Vacio } from '@/components/statistics/Vacio';
import { decimal } from '../formato';

/** "×1,9". */
function veces(oddsRatio: number): string {
  return `×${decimal(oddsRatio, oddsRatio >= 10 ? 0 : 2)}`;
}

/**
 * Los odds ratios en barras que salen del medio. Van en escala logarítmica:
 * duplicar y reducir a la mitad las chances es el mismo tamaño de efecto, y
 * en escala lineal el ×0,5 quedaba en la mitad de largo que el ×2.
 */
export function GraficoFactores({ factores }: Readonly<{ factores: FactorAsistencia[] }>) {
  if (factores.length === 0) return <Vacio texto="El modelo no guardó sus factores." />;
  const orden = [...factores].sort((a, b) => b.oddsRatio - a.oddsRatio);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_56px] gap-3 text-[11px] text-muted-foreground">
        <span />
        <span className="flex justify-between">
          <span className="inline-flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" />baja las chances</span>
          <span className="inline-flex items-center gap-0.5">sube las chances<ArrowUpRight className="h-3 w-3" /></span>
        </span>
        <span />
      </div>
      <BarrasDivergentes
        unidad=""
        filas={orden.map((f) => ({
          nombre: f.nombre,
          valor: Math.log(Math.max(1e-6, f.oddsRatio)),
          etiqueta: veces(f.oddsRatio),
          neutro: f.efecto === 'neutro',
          detalle: f.efecto === 'neutro' ? 'casi no cambia nada' : `las chances de ir se multiplican por ${decimal(f.oddsRatio, 2)}`,
        }))}
      />
      <p className="text-center text-[11px] text-muted-foreground">
        Cuánto se multiplican las chances de ir cuando el factor sube un desvío estándar, con todo lo demás igual.
      </p>
    </div>
  );
}

/** Nombre del factor con la primera letra en minúscula, para meterlo en una oración. */
function enOracion(nombre: string): string {
  return nombre.charAt(0).toLowerCase() + nombre.slice(1);
}

/** Los factores que más pesan, contados como frases. */
export function FactoresEnPalabras({ factores }: Readonly<{ factores: FactorAsistencia[] }>) {
  const tema = useTemaGraficos();
  const suben = factores.filter((f) => f.efecto === 'sube').sort((a, b) => b.oddsRatio - a.oddsRatio).slice(0, 3);
  const bajan = factores.filter((f) => f.efecto === 'baja').sort((a, b) => a.oddsRatio - b.oddsRatio).slice(0, 3);
  const neutros = factores.filter((f) => f.efecto === 'neutro');
  if (factores.length === 0) return <Vacio texto="Sin factores." />;

  return (
    <div className="space-y-3 text-sm">
      {suben.map((f) => (
        <Frase key={f.clave} color={tema.positivo} icono={<ArrowUpRight className="h-4 w-4" />}>
          Más <b>{enOracion(f.nombre)}</b>: las chances de ir se multiplican por <b className="tabular-nums">{decimal(f.oddsRatio, 1)}</b>.
        </Frase>
      ))}
      {bajan.map((f) => (
        <Frase key={f.clave} color={tema.negativo} icono={<ArrowDownRight className="h-4 w-4" />}>
          Más <b>{enOracion(f.nombre)}</b>: las chances de ir bajan un <b className="tabular-nums">{Math.round((1 - f.oddsRatio) * 100)}%</b>.
        </Frase>
      ))}
      {neutros.length > 0 && (
        <Frase color={tema.vencidas} icono={<Equal className="h-4 w-4" />}>
          Casi no pesan: {neutros.map((f) => enOracion(f.nombre)).join(', ')}.
        </Frase>
      )}
    </div>
  );
}

function Frase({ color, icono, children }: Readonly<{ color: string; icono: React.ReactNode; children: React.ReactNode }>) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 px-3 py-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
        {icono}
      </span>
      <p className="leading-snug">{children}</p>
    </div>
  );
}
