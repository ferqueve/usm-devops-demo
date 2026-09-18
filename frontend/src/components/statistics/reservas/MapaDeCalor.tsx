import { useMemo } from 'react';
import type { HeatmapCelda } from '@/lib/api/stats';

// 0 = domingo, como EXTRACT(DOW) en Postgres. Se muestra de lunes a domingo.
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
// Sin datos, el horario del campus; con datos, se ajusta a las horas usadas.
const HORARIO_CAMPUS = { desde: 8, hasta: 21 };

/**
 * Día de la semana por hora, con las reservas aprobadas. Una sola escala de
 * azul: más oscuro, más reservas. Cada celda lleva su número, así que el
 * color no es la única forma de leerla.
 */
export function MapaDeCalor({ celdas }: Readonly<{ celdas: HeatmapCelda[] }>) {
  const { matriz, maximo, pico, horas, porDia } = useMemo(() => {
    const m: Record<number, Record<number, number>> = {};
    const totalDia: Record<number, number> = {};
    for (const d of ORDEN_DIAS) {
      m[d] = {};
      totalDia[d] = 0;
    }
    let max = 0;
    let top: HeatmapCelda | null = null;
    for (const c of celdas) {
      m[c.diaSemana][c.hora] = c.cant;
      totalDia[c.diaSemana] += c.cant;
      if (c.cant > max) {
        max = c.cant;
        top = c;
      }
    }
    // Antes la grilla iba fija de 7 a 22 y esas dos columnas quedaban siempre vacías.
    const usadas = celdas.map((c) => c.hora);
    const desde = usadas.length ? Math.min(...usadas) : HORARIO_CAMPUS.desde;
    const hasta = usadas.length ? Math.max(...usadas) : HORARIO_CAMPUS.hasta;
    return {
      matriz: m,
      maximo: max,
      pico: top,
      horas: Array.from({ length: hasta - desde + 1 }, (_, i) => i + desde),
      porDia: totalDia,
    };
  }, [celdas]);

  if (maximo === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Sin reservas aprobadas en el período.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-[3px] text-2xs" style={{ minWidth: 90 + horas.length * 36 }}>
          <thead>
            <tr>
              <th className="w-10" />
              {horas.map((h) => (
                <th key={h} className="pb-1 text-center font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
              <th className="w-14 pb-1 pl-2 text-right font-medium text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {ORDEN_DIAS.map((dia) => (
              <tr key={dia}>
                <td className="pr-2 text-right font-medium text-muted-foreground">{DIAS[dia]}</td>
                {horas.map((h) => {
                  const cant = matriz[dia][h] ?? 0;
                  const intensidad = cant / maximo;
                  return (
                    <td
                      key={h}
                      title={`${DIAS[dia]} ${h}:00 · ${cant} reservas`}
                      className={`h-8 rounded text-center align-middle tabular-nums ${cant === 0 ? 'bg-muted/60 text-transparent' : ''}`}
                      style={
                        cant === 0
                          ? undefined
                          : {
                              backgroundColor: `rgba(31, 85, 171, ${0.12 + intensidad * 0.88})`,
                              color: intensidad > 0.45 ? '#ffffff' : 'var(--foreground)',
                            }
                      }
                    >
                      {cant || ''}
                    </td>
                  );
                })}
                <td className="pl-2 text-right font-semibold tabular-nums">{porDia[dia].toLocaleString('es-UY')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
        {pico && (
          <span>
            Pico: <b className="text-foreground">{DIAS[pico.diaSemana]} {pico.hora}:00</b> con {pico.cant} reservas
          </span>
        )}
        <span className="flex items-center gap-1.5">
          menos
          {[0.12, 0.34, 0.56, 0.78, 1].map((a) => (
            <span key={a} className="h-3 w-4 rounded-sm" style={{ backgroundColor: `rgba(31, 85, 171, ${a})` }} />
          ))}
          más
        </span>
      </div>
    </div>
  );
}
