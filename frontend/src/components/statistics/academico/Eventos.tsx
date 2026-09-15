import { Star, Ticket, Users } from 'lucide-react';
import type { Academico } from '@/lib/api/stats';
import { BarrasTramos } from '../graficos/BarrasTramos';
import { Dona } from '../graficos/Dona';
import { Medidor } from '../graficos/Medidor';
import { useTemaGraficos } from '../graficos/tema';
import { Vacio } from '../Vacio';
import { entero, porcentaje } from '../reservas/formato';
import { Estrellas } from './Visuales';

type Evento = Academico['eventosLista'][number];

const TIPOS: Record<string, string> = {
  EVENTO: 'Eventos',
  CURSO: 'Cursos',
  TALLER: 'Talleres',
  CHARLA: 'Charlas',
  CONFERENCIA: 'Conferencias',
  SEMINARIO: 'Seminarios',
};
const nombreTipo = (t: string) => TIPOS[t] ?? t.charAt(0) + t.slice(1).toLowerCase();

/** Qué parte del cupo se llenó, con los totales y la calificación. */
export function EventosResumen({ e, grande = false }: Readonly<{ e: Academico['eventos']; grande?: boolean }>) {
  if (Number(e.total) === 0) return <Vacio texto="No hubo eventos en el período." />;
  const cifras = [
    { icono: Ticket, valor: entero(e.total), etiqueta: Number(e.total) === 1 ? 'evento' : 'eventos' },
    { icono: Users, valor: entero(e.inscripciones), etiqueta: 'inscripciones' },
    { icono: Star, valor: e.ratingPromedio == null ? '—' : e.ratingPromedio.toLocaleString('es-UY', { maximumFractionDigits: 1 }), etiqueta: 'calificación' },
  ];
  return (
    <div className="space-y-4">
      <Medidor
        valor={porcentaje(Number(e.inscripciones), Number(e.cupoTotal))}
        etiqueta="Cupo ocupado"
        detalle={`${entero(e.inscripciones)} de ${entero(e.cupoTotal)} lugares`}
        umbrales={{ alerta: 30, aviso: 60 }}
        ancho={grande ? 240 : 170}
      />
      <div className="grid grid-cols-3 gap-2">
        {cifras.map((c) => (
          <div key={c.etiqueta} className="rounded-lg border bg-muted/30 px-2 py-2 text-center">
            <c.icono className="mx-auto mb-0.5 h-3.5 w-3.5 text-muted-foreground" />
            <div className="text-sm font-semibold tabular-nums">{c.valor}</div>
            <div className="text-[10px] leading-tight text-muted-foreground">{c.etiqueta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TRAMOS = [
  { etiqueta: '< 25%', hasta: 25 },
  { etiqueta: '25–50%', hasta: 50 },
  { etiqueta: '50–75%', hasta: 75 },
  { etiqueta: '75–99%', hasta: 100 },
  { etiqueta: 'Llenos', hasta: Infinity },
];

/** Cuántos eventos quedaron por tramo de ocupación del cupo. */
export function EventosPorOcupacion({ eventos, alto = 210 }: Readonly<{ eventos: Evento[]; alto?: number }>) {
  const tema = useTemaGraficos();
  const conCupo = eventos.filter((e) => e.cupo != null && Number(e.cupo) > 0);
  if (conCupo.length === 0) return <Vacio texto="Ningún evento del período tiene cupo." />;
  const cuenta = TRAMOS.map(() => 0);
  for (const e of conCupo) {
    const pct = (Number(e.inscriptos) / Number(e.cupo)) * 100;
    cuenta[TRAMOS.findIndex((t) => pct < t.hasta)]++;
  }
  const colores = [tema.vencidas, tema.mantenimiento, tema.categorias[0], tema.disponible, tema.danado];
  const sinCupo = eventos.length - conCupo.length;
  return (
    <div>
      <BarrasTramos
        alto={alto}
        tramos={TRAMOS.map((t, i) => ({ etiqueta: t.etiqueta, segmentos: [{ nombre: 'Eventos', valor: cuenta[i], color: colores[i] }] }))}
      />
      {sinCupo > 0 && <p className="mt-2 text-center text-xs text-muted-foreground">{sinCupo} sin cupo definido no se cuentan.</p>}
    </div>
  );
}

/** Eventos por tipo, con la ocupación del cupo de cada uno. */
export function EventosPorTipo({ eventos, grande = false }: Readonly<{ eventos: Evento[]; grande?: boolean }>) {
  const tema = useTemaGraficos();
  if (eventos.length === 0) return <Vacio texto="No hubo eventos en el período." />;
  const grupos = new Map<string, { cantidad: number; inscriptos: number; cupo: number }>();
  for (const e of eventos) {
    const g = grupos.get(e.tipo) ?? { cantidad: 0, inscriptos: 0, cupo: 0 };
    grupos.set(e.tipo, { cantidad: g.cantidad + 1, inscriptos: g.inscriptos + Number(e.inscriptos), cupo: g.cupo + Number(e.cupo ?? 0) });
  }
  const orden = [...grupos.entries()].sort((a, b) => b[1].cantidad - a[1].cantidad);
  return (
    <div className="space-y-3">
      <Dona
        tamano={grande ? 220 : 124}
        leyendaCentro={eventos.length === 1 ? 'evento' : 'eventos'}
        porciones={orden.map(([tipo, g], i) => ({ nombre: nombreTipo(tipo), valor: g.cantidad, color: tema.categorias[i % tema.categorias.length] }))}
      />
      <ul className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
        {orden.map(([tipo, g]) => (
          <li key={tipo} className="flex justify-between gap-2">
            <span className="truncate">{nombreTipo(tipo)}</span>
            <span className="tabular-nums">
              {g.cupo > 0 ? <>llenan el <b className="text-foreground">{porcentaje(g.inscriptos, g.cupo)}%</b> del cupo</> : `${entero(g.inscriptos)} inscriptos`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Los eventos mejor calificados, con cuántos fueron. */
export function MejorCalificados({ eventos, limite = 6 }: Readonly<{ eventos: Evento[]; limite?: number }>) {
  const calificados = eventos.filter((e) => e.ratingPromedio != null).sort((a, b) => Number(b.ratingPromedio) - Number(a.ratingPromedio)).slice(0, limite);
  if (calificados.length === 0) return <Vacio texto="Todavía no hay eventos calificados en el período." />;
  return (
    <ol className="space-y-2.5">
      {calificados.map((e, i) => (
        <li key={e.id} className="flex items-center gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-utec-yellow text-utec-dark' : 'bg-muted text-muted-foreground'}`}>
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium" title={e.titulo}>{e.titulo}</div>
            <div className="text-[11px] text-muted-foreground">
              {nombreTipo(e.tipo)} · {entero(e.inscriptos)} inscriptos
            </div>
          </div>
          <Estrellas valor={e.ratingPromedio} chico />
        </li>
      ))}
    </ol>
  );
}
