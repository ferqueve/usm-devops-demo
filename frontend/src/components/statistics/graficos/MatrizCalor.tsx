import { useTemaGraficos } from './tema';

export interface CeldaMatriz {
  fila: string;
  columna: string | number;
  /** 0 a 100. */
  valor: number;
  /** Marca de atención (p. ej. horas en que se llenó todo). */
  marca?: number;
  detalle?: string;
}

interface Props {
  filas: string[];
  columnas: Array<string | number>;
  celdas: CeldaMatriz[];
  etiquetaColumna?: (c: string | number) => string;
  etiquetaMarca?: string;
  /** Texto chico al lado del nombre de la fila. */
  notaFila?: (f: string) => string | undefined;
}

/**
 * Matriz de calor fila × columna con porcentajes. Una tinta de claro a
 * oscuro, el número escrito en la celda y un punto donde hay marca, para no
 * depender sólo del color.
 */
export function MatrizCalor({ filas, columnas, celdas, etiquetaColumna = String, etiquetaMarca = 'marca', notaFila }: Readonly<Props>) {
  const tema = useTemaGraficos();
  const mapa = new Map(celdas.map((c) => [`${c.fila}|${c.columna}`, c]));
  const maximo = Math.max(1, ...celdas.map((c) => c.valor));
  if (filas.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos en el período.</p>;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-[3px] text-2xs" style={{ minWidth: 130 + columnas.length * 34 }}>
          <thead>
            <tr>
              <th className="w-[120px]" />
              {columnas.map((c) => (
                <th key={c} className="pb-1 text-center font-medium text-muted-foreground">{etiquetaColumna(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f}>
                <td className="truncate pr-2 text-right font-medium" title={f}>
                  {f}
                  {notaFila?.(f) && <span className="block text-2xs font-normal text-muted-foreground">{notaFila(f)}</span>}
                </td>
                {columnas.map((c) => {
                  const celda = mapa.get(`${f}|${c}`);
                  const v = celda?.valor ?? 0;
                  const t = v / maximo;
                  return (
                    <td
                      key={c}
                      title={`${f} · ${etiquetaColumna(c)}: ${Math.round(v)}%${celda?.marca ? ` · ${celda.marca} ${etiquetaMarca}` : ''}${celda?.detalle ? ` · ${celda.detalle}` : ''}`}
                      className="relative h-8 rounded text-center align-middle tabular-nums"
                      style={{
                        backgroundColor: v > 0 ? tema.secuencial(0.08 + t * 0.92) : tema.vacio,
                        color: v > 0 ? tema.secuencialTexto(0.08 + t * 0.92) : 'transparent',
                      }}
                    >
                      {v >= 1 ? Math.round(v) : ''}
                      {!!celda?.marca && (
                        <span
                          className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-white/80"
                          style={{ backgroundColor: tema.danado }}
                          aria-hidden
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tema.danado }} /> {etiquetaMarca}
        </span>
        <span className="flex items-center gap-1">
          0%
          {[0.1, 0.35, 0.6, 0.85, 1].map((a) => (
            <span key={a} className="h-3 w-4 rounded-sm" style={{ backgroundColor: tema.secuencial(a) }} />
          ))}
          {Math.round(maximo)}%
        </span>
      </div>
    </div>
  );
}
