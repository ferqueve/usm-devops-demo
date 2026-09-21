import { useColores } from '../colores';
import { entero } from '../formato';
import type { Dia } from './usePredicciones';

function etiquetaDia(fecha: string): { semana: string; fecha: string } {
  const d = new Date(`${fecha}T00:00:00Z`);
  return {
    semana: d.toLocaleDateString('es-UY', { weekday: 'short', timeZone: 'UTC' }).replace('.', ''),
    fecha: d.toLocaleDateString('es-UY', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', ''),
  };
}

/**
 * Los treinta días uno por uno. Es la versión en tabla del gráfico: cada
 * valor que el gráfico muestra con color o al pasar el mouse está acá en
 * texto.
 */
export function TablaDias({ dias }: Readonly<{ dias: Dia[] }>) {
  const colores = useColores();
  const pico = Math.max(...dias.map((d) => d.esperadas));

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10 bg-card text-2xs uppercase tracking-wide text-muted-foreground">
        <tr className="border-b">
          <th className="px-3 py-2 text-left font-medium">Día</th>
          <th className="px-3 py-2 text-right font-medium">Esperadas</th>
          <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Rango</th>
          <th className="px-3 py-2 text-left font-medium">Ya aprobadas</th>
        </tr>
      </thead>
      <tbody>
        {dias.map((d) => {
          const etiqueta = etiquetaDia(d.fecha);
          const cobertura = d.esperadas > 0 ? Math.min(100, (d.confirmadas / d.esperadas) * 100) : 0;
          const finDeSemana = ['sáb', 'dom'].includes(etiqueta.semana.toLowerCase());
          return (
            <tr key={d.fecha} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
              <td className="px-3 py-1.5">
                <span className={`inline-block w-10 capitalize ${finDeSemana ? 'text-muted-foreground' : 'font-medium'}`}>
                  {etiqueta.semana}
                </span>
                <span className="text-muted-foreground">{etiqueta.fecha}</span>
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                <span className={d.esperadas === pico ? 'font-semibold' : ''}>{entero(d.esperadas)}</span>
              </td>
              <td className="hidden px-3 py-1.5 text-right tabular-nums text-muted-foreground sm:table-cell">
                {entero(d.minimo)}–{entero(d.maximo)}
              </td>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-full max-w-[96px] overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cobertura}%`, backgroundColor: colores.reservadas }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums">{d.confirmadas}</span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
