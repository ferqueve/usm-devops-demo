import { useMemo } from 'react';
import { formatoNumero, useTemaGraficos } from './tema';

interface Props {
  /** Un valor por día, YYYY-MM-DD. */
  dias: Array<{ fecha: string; valor: number }>;
  unidad?: string;
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function diaSemana(fecha: string): number {
  return (new Date(`${fecha}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/**
 * Calendario de calor: cada cuadrado es un día, más oscuro con más reservas.
 * Deja ver de un vistazo feriados, recesos, la semana de exámenes o el lunes
 * que se llenó, cosas que un promedio por semana esconde.
 */
export function CalendarioCalor({ dias, unidad = 'reservas' }: Readonly<Props>) {
  const tema = useTemaGraficos();

  const { semanas, meses, maximo, total, mejor } = useMemo(() => {
    const max = Math.max(0, ...dias.map((d) => d.valor));
    const cols: Array<Array<{ fecha: string; valor: number } | null>> = [];
    let columna: Array<{ fecha: string; valor: number } | null> = [];
    const primero = dias[0] ? diaSemana(dias[0].fecha) : 0;
    for (let i = 0; i < primero; i++) columna.push(null);
    for (const d of dias) {
      columna.push(d);
      if (columna.length === 7) {
        cols.push(columna);
        columna = [];
      }
    }
    if (columna.length) {
      while (columna.length < 7) columna.push(null);
      cols.push(columna);
    }
    // Etiqueta de mes en la columna que tiene su día 1, y en la primera columna.
    const etiquetas = cols.map((col, i) => {
      const inicio = col.find((x) => x && x.fecha.endsWith('-01')) ?? (i === 0 ? col.find(Boolean) : null);
      if (!inicio) return '';
      return new Date(`${inicio.fecha}T00:00:00Z`).toLocaleDateString('es-UY', { month: 'short', timeZone: 'UTC' }).replace('.', '');
    });
    const top = dias.reduce<{ fecha: string; valor: number } | null>((m, d) => (!m || d.valor > m.valor ? d : m), null);
    return { semanas: cols, meses: etiquetas, maximo: max, total: dias.reduce((a, d) => a + d.valor, 0), mejor: top };
  }, [dias]);

  if (dias.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos en el período.</p>;
  }

  // Con pocas semanas los cuadrados crecen y llevan el día y el número: 30
  // días en cuadraditos de 16 px quedaban perdidos en el panel.
  const grande = semanas.length <= 6;
  // minmax: en celular las columnas se achican hasta entrar; en escritorio topan y se centran.
  const columna = grande ? 'minmax(18px, 56px)' : semanas.length <= 15 ? 'minmax(12px, 36px)' : 'minmax(6px, 16px)';

  // Grilla de 8 filas (mes + 7 días) que se llena por columnas: las etiquetas
  // de los días comparten fila con sus cuadrados y quedan siempre alineadas.
  const celdas = [
    <div key="esquina" />,
    // Con cuadrados chicos no entran siete etiquetas: van día por medio.
    ...DIAS.map((d, i) => (
      <div key={`d${i}`} className="flex items-center pr-1.5 text-2xs leading-none text-muted-foreground">
        {grande || i % 2 === 0 ? d : ''}
      </div>
    )),
    ...semanas.flatMap((col, i) => [
      <div key={`m${i}`} className="h-3.5 whitespace-nowrap text-2xs leading-none text-muted-foreground">
        {meses[i]}
      </div>,
      ...col.map((d, j) => {
        if (!d) return <div key={`v${i}-${j}`} className="aspect-square w-full" />;
        const t = maximo > 0 ? d.valor / maximo : 0;
        return (
          <div
            key={d.fecha}
            title={`${new Date(`${d.fecha}T00:00:00Z`).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}: ${formatoNumero(d.valor)} ${unidad}`}
            className={`aspect-square w-full rounded-[3px] ${grande ? 'relative flex items-end justify-end p-1' : ''}`}
            style={{ backgroundColor: d.valor === 0 ? tema.vacio : tema.secuencial(t) }}
          >
            {grande && (
              <>
                <span className="absolute left-1 top-0.5 text-2xs leading-none opacity-70" style={{ color: tema.secuencialTexto(t) }}>
                  {Number(d.fecha.slice(8, 10))}
                </span>
                <span className="text-2xs font-semibold leading-none tabular-nums" style={{ color: tema.secuencialTexto(t) }}>
                  {d.valor || ''}
                </span>
              </>
            )}
          </div>
        );
      }),
    ]),
  ];

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div
          className="grid w-full justify-center gap-[3px]"
          style={{
            gridTemplateRows: 'auto repeat(7, auto)',
            gridAutoFlow: 'column',
            gridTemplateColumns: `28px repeat(${semanas.length}, ${columna})`,
            minWidth: semanas.length * (semanas.length > 15 ? 9 : 15) + 30,
          }}
        >
          {celdas}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {formatoNumero(total)} {unidad} en {dias.length} días
          {mejor && mejor.valor > 0 && (
            <>
              {' · '}el día con más fue el{' '}
              <b className="text-foreground">
                {new Date(`${mejor.fecha}T00:00:00Z`).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })}
              </b>{' '}
              ({formatoNumero(mejor.valor)})
            </>
          )}
        </span>
        <span className="flex items-center gap-1">
          menos
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <span key={t} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: t === 0 ? tema.vacio : tema.secuencial(t) }} />
          ))}
          más
        </span>
      </div>
    </div>
  );
}
