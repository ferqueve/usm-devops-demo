import { AlertTriangle, CheckCircle2, Clock, Timer } from 'lucide-react';
import type { AnalistaAprobacion, Aprobacion } from '@/lib/api/stats';
import { Apiladas100 } from '../graficos/Apiladas100';
import { BarrasTramos } from '../graficos/BarrasTramos';
import { Medidor } from '../graficos/Medidor';
import { mezclar, useTemaGraficos } from '../graficos/tema';
import { demora, entero, porcentaje } from './formato';
import { colorDemora } from './filtros';
import { Vacio } from '../Vacio';



/** Mediana, p90 y qué parte se responde en el día, con un medidor. */
export function RespuestaKpis({ datos, grande = false }: Readonly<{ datos: Aprobacion['respuesta']; grande?: boolean }>) {
  const tema = useTemaGraficos();
  if (datos.conDato === 0) return <Vacio texto="No hay reservas respondidas con fecha de respuesta en el período." />;
  const filas = [
    { icono: Timer, etiqueta: 'Mediana', valor: demora(datos.medianaHoras), detalle: 'la mitad se responde antes', color: colorDemora(datos.medianaHoras, tema) },
    { icono: Clock, etiqueta: '9 de cada 10', valor: demora(datos.p90Horas), detalle: 'se responden antes de esto', color: colorDemora(datos.p90Horas, tema) },
  ];
  return (
    <div className={grande ? 'grid items-center gap-8 md:grid-cols-2' : 'space-y-4'}>
      <Medidor
        valor={datos.dentroDe24hPct ?? 0}
        etiqueta="En menos de 24 h"
        detalle={`de ${entero(datos.conDato)} respuestas`}
        umbrales={{ alerta: 50, aviso: 75 }}
        ancho={grande ? 240 : 160}
      />
      <div className="grid grid-cols-2 gap-2">
        {filas.map((f) => (
          <div key={f.etiqueta} className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <f.icono className="h-3.5 w-3.5" style={{ color: f.color }} />
              {f.etiqueta}
            </div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: f.color }}>{f.valor}</div>
            <div className="text-[10px] leading-tight text-muted-foreground">{f.detalle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Histograma de cuánto se tarda en responder, de verde (rápido) a rojo. */
export function HistogramaRespuesta({ tramos, alto = 200 }: Readonly<{ tramos: Aprobacion['distribucionRespuesta']; alto?: number }>) {
  const tema = useTemaGraficos();
  const n = Math.max(1, tramos.length - 1);
  return (
    <BarrasTramos
      alto={alto}
      tramos={tramos.map((t, i) => ({
        etiqueta: t.tramo,
        segmentos: [
          {
            nombre: 'Respuestas',
            valor: Number(t.cantidad),
            color: i / n < 0.5 ? mezclar(tema.disponible, tema.mantenimiento, (i / n) * 2) : mezclar(tema.mantenimiento, tema.danado, (i / n - 0.5) * 2),
          },
        ],
      }))}
    />
  );
}

/**
 * Una fila por analista: la barra es su carga (ancho relativo al que más
 * tiene) partida en aprobadas, canceladas y pendientes; al lado, las vencidas
 * y su mediana de respuesta con semáforo.
 */
export function Analistas({ filas }: Readonly<{ filas: AnalistaAprobacion[] }>) {
  const tema = useTemaGraficos();
  if (filas.length === 0) return <Vacio texto="Ninguna reserva del período tiene analista asignado." />;
  const maximo = Math.max(1, ...filas.map((a) => Number(a.asignadas)));
  const segmentos = [
    { clave: 'aprobadas', nombre: 'Aprobadas', color: tema.aprobadas },
    { clave: 'canceladas', nombre: 'Canceladas', color: tema.canceladas },
    { clave: 'pendientes', nombre: 'Pendientes', color: tema.pendientes },
  ] as const;
  return (
    <div>
      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_52px_64px] gap-2 border-b pb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:grid-cols-[140px_minmax(0,1fr)_60px_72px]">
        <span>Analista</span>
        <span className="hidden sm:block">Carga</span>
        <span className="text-right">Vencidas</span>
        <span className="text-right">Mediana</span>
      </div>
      <ul className="space-y-2">
        {filas.map((a) => {
          const total = Number(a.asignadas);
          const vencidas = Number(a.vencidas);
          const mediana = a.medianaHoras;
          return (
            <li key={a.usuarioId} className="grid grid-cols-[minmax(0,1fr)_52px_64px] items-center gap-2 text-sm sm:grid-cols-[140px_minmax(0,1fr)_60px_72px]">
              <div className="min-w-0">
                <div className="truncate font-medium" title={a.nombre}>{a.nombre}</div>
                <div className="text-[11px] tabular-nums text-muted-foreground">{entero(total)} asignadas</div>
                {/* En celular la barra va debajo del nombre. */}
                <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-muted sm:hidden" style={{ width: `${(total / maximo) * 100}%` }}>
                  {segmentos.map((s) => (
                    <div key={s.clave} style={{ flexGrow: Number(a[s.clave]), backgroundColor: s.color }} />
                  ))}
                </div>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <div
                  className="flex h-3.5 gap-[2px] overflow-hidden rounded"
                  style={{ width: `${Math.max(2, (total / maximo) * 100)}%` }}
                  title={segmentos.map((s) => `${s.nombre}: ${entero(Number(a[s.clave]))}`).join(' · ')}
                >
                  {segmentos.map((s) => (Number(a[s.clave]) > 0 ? <div key={s.clave} style={{ flexGrow: Number(a[s.clave]), backgroundColor: s.color }} /> : null))}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{porcentaje(Number(a.aprobadas), Number(a.aprobadas) + Number(a.canceladas))}% ok</span>
              </div>
              <span className="text-right tabular-nums">
                {vencidas > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded bg-utec-red/12 px-1.5 py-0.5 text-xs font-semibold text-utec-red">
                    <AlertTriangle className="h-3 w-3" />
                    {entero(vencidas)}
                  </span>
                ) : (
                  <CheckCircle2 className="ml-auto h-4 w-4 text-utec-green" aria-label="sin vencidas" />
                )}
              </span>
              <span className="text-right">
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                  style={{ backgroundColor: `${colorDemora(mediana, tema)}22`, color: colorDemora(mediana, tema) }}
                >
                  {demora(mediana)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segmentos.map((s) => (
          <span key={s.clave} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.nombre}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Cómo terminan las reservas según con cuánta antelación se pidieron. */
export function Antelacion({ tramos }: Readonly<{ tramos: Aprobacion['antelacion'] }>) {
  const tema = useTemaGraficos();
  return (
    <Apiladas100
      filas={tramos.map((t) => ({
        etiqueta: t.tramo,
        segmentos: [
          { nombre: 'Aprobadas', valor: Number(t.aprobadas), color: tema.aprobadas },
          { nombre: 'Canceladas', valor: Number(t.canceladas), color: tema.canceladas },
          { nombre: 'Pendientes', valor: Number(t.pendientes), color: tema.pendientes, texto: '#1f2937' },
        ],
      }))}
    />
  );
}

/** Pendientes por antigüedad, con las vencidas en rojo arriba de cada columna. */
export function PendientesAntiguedad({ tramos, alto = 200 }: Readonly<{ tramos: Aprobacion['pendientesPorAntiguedad']; alto?: number }>) {
  const tema = useTemaGraficos();
  const total = tramos.reduce((a, t) => a + Number(t.cantidad), 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <CheckCircle2 className="h-8 w-8 text-utec-green" />
        No quedan reservas pendientes del período.
      </div>
    );
  }
  const vencidas = tramos.reduce((a, t) => a + Number(t.vencidas), 0);
  return (
    <div>
      <BarrasTramos
        alto={alto}
        tramos={tramos.map((t) => ({
          etiqueta: t.tramo,
          segmentos: [
            { nombre: 'A tiempo', valor: Math.max(0, Number(t.cantidad) - Number(t.vencidas)), color: tema.pendientes },
            { nombre: 'Vencidas', valor: Number(t.vencidas), color: tema.danado },
          ],
        }))}
        leyenda
      />
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {vencidas === total ? (
          <>Las <b className="text-utec-red">{entero(total)}</b> ya vencieron: su fecha pasó sin respuesta.</>
        ) : vencidas === 0 ? (
          'Todas están a tiempo de resolverse.'
        ) : (
          <><b className="text-utec-red">{entero(vencidas)}</b> de {entero(total)} ya vencieron; {entero(total - vencidas)} siguen a tiempo.</>
        )}
      </p>
    </div>
  );
}
