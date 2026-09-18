import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import { CalendarDays, Star } from 'lucide-react';
import type { Academico } from '@/lib/api/stats';
import { Mancuernas } from '../graficos/Mancuernas';
import { Medidor } from '../graficos/Medidor';
import { Waffle } from '../graficos/Waffle';
import { formatoNumero, useTemaGraficos } from '../graficos/tema';
import { fechaCorta } from '../periodo';
import { Vacio } from '../Vacio';
import { entero, porcentaje, rating } from '../reservas/formato';
import { GloboGrafico } from '@/components/common/dataviz';

/** Estrellas de 1 a 5 con medias, y el número al lado. */
export function Estrellas({ valor, chico = false }: Readonly<{ valor: number | null | undefined; chico?: boolean }>) {
  if (valor == null) return <span className="text-xs text-muted-foreground">sin calificar</span>;
  const tam = chico ? 'h-3 w-3' : 'h-4 w-4';
  return (
    <span className="inline-flex items-center gap-1" title={`${rating(valor)} de 5`}>
      <span className="relative inline-flex">
        <span className="flex text-muted-foreground/30">
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={`${tam} fill-current`} />)}
        </span>
        <span className="absolute inset-0 flex overflow-hidden text-marca-amarillo-texto" style={{ width: `${(Math.max(0, Math.min(5, valor)) / 5) * 100}%` }}>
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={`${tam} shrink-0 fill-current`} />)}
        </span>
      </span>
      <b className={`tabular-nums ${chico ? 'text-xs' : 'text-sm'}`}>{rating(valor)}</b>
    </span>
  );
}

/** Asistencia y ocupación del cupo con medidores, y la calificación. */
export function TutoriasKpis({ t, grande = false }: Readonly<{ t: Academico['tutorias']; grande?: boolean }>) {
  if (t.total === 0) return <Vacio texto="No hubo tutorías en el período." />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Medidor
          valor={t.asistenciaPct ?? 0}
          etiqueta="Asistencia"
          detalle={`${entero(t.asistieron)} de ${entero(t.agendadas)} agendadas`}
          umbrales={{ alerta: 50, aviso: 70 }}
          ancho={grande ? 220 : 150}
        />
        <Medidor
          valor={t.ocupacionCupoPct ?? 0}
          etiqueta="Cupo ocupado"
          detalle={`${entero(t.agendadas)} de ${entero(t.cupoTotal)} lugares`}
          umbrales={{ alerta: 30, aviso: 60 }}
          ancho={grande ? 220 : 150}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
        <Estrellas valor={t.ratingPromedio} />
        <span className="text-xs text-muted-foreground">{entero(t.feedbacks)} opiniones</span>
      </div>
    </div>
  );
}

/** Presencial o virtual en cien cuadros, y grupal o individual en una barra. */
export function ModalidadTutorias({ t, grande = false }: Readonly<{ t: Academico['tutorias']; grande?: boolean }>) {
  const tema = useTemaGraficos();
  if (t.total === 0) return <Vacio texto="No hubo tutorías en el período." />;
  const grupales = Number(t.grupales);
  const individuales = Number(t.individuales);
  return (
    <div className="space-y-4">
      <Waffle
        apilado
        celda={grande ? 24 : 17}
        grupos={[
          { nombre: 'Presenciales', valor: Number(t.presenciales), color: tema.categorias[0] },
          { nombre: 'Virtuales', valor: Number(t.virtuales), color: tema.categorias[1] },
        ]}
      />
      <div className="border-t pt-3">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Grupales <b className="text-foreground">{porcentaje(grupales, grupales + individuales)}%</b></span>
          <span>Individuales <b className="text-foreground">{porcentaje(individuales, grupales + individuales)}%</b></span>
        </div>
        <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-muted" title={`${grupales} grupales · ${individuales} individuales`}>
          {grupales > 0 && <div style={{ flexGrow: grupales, backgroundColor: tema.categorias[2] }} />}
          {individuales > 0 && <div style={{ flexGrow: individuales, backgroundColor: tema.categorias[3] }} />}
        </div>
      </div>
    </div>
  );
}

type Semana = Academico['porSemana'][number] & { incompleta: boolean };

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function GloboSemana({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Semana;
  return (
    <GloboGrafico>
      <p className="mb-1 font-medium">Semana del {fechaCorta(p.semana)}{p.incompleta ? ' (incompleta)' : ''}</p>
      <p>{formatoNumero(p.tutorias)} tutorías</p>
      <p>Agendadas: <b>{formatoNumero(p.agendadas)}</b></p>
      <p>Asistieron: <b>{formatoNumero(p.asistieron)}</b> ({porcentaje(p.asistieron, p.agendadas)}%)</p>
    </GloboGrafico>
  );
}

/**
 * Agendadas y asistencias por semana, en barras lado a lado y en la misma
 * escala. Las semanas que el período corta (o que todavía no terminaron) van
 * más claras, como en la evolución de reservas.
 */
export function SemanasTutorias({ semanas, alto = 240, desde, hasta }: Readonly<{ semanas: Academico['porSemana']; alto?: number; desde?: string; hasta?: string }>) {
  const tema = useTemaGraficos();
  if (semanas.every((s) => Number(s.agendadas) === 0)) return <Vacio texto="No hubo inscripciones a tutorías en el período." />;
  const colorA = tema.categorias[0];
  const colorB = tema.aprobadas;
  const datos: Semana[] = semanas.map((s) => ({
    ...s,
    incompleta: (desde != null && s.semana < desde) || (hasta != null && sumarDias(s.semana, 6) > hasta),
  }));
  const hayIncompletas = datos.some((d) => d.incompleta);
  return (
    <div>
      <ResponsiveContainer width="100%" height={alto}>
        <BarChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid stroke={tema.grilla} vertical={false} />
          <XAxis dataKey="semana" tickFormatter={(s: string) => fechaCorta(s)} tick={{ fontSize: 11, fill: tema.eje }} axisLine={{ stroke: tema.grilla }} tickLine={false} minTickGap={16} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: tema.eje }} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<GloboSemana />} cursor={{ fill: tema.grilla, fillOpacity: 0.5 }} />
          <Bar dataKey="agendadas" name="Agendadas" fill={colorA} radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {datos.map((d) => <Cell key={d.semana} fill={colorA} fillOpacity={d.incompleta ? 0.35 : 1} />)}
          </Bar>
          <Bar dataKey="asistieron" name="Asistieron" fill={colorB} radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {datos.map((d) => <Cell key={d.semana} fill={colorB} fillOpacity={d.incompleta ? 0.35 : 1} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorA }} />Agendadas</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorB }} />Asistieron</span>
        {hayIncompletas && (
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorA, opacity: 0.35 }} />semana incompleta</span>
        )}
      </div>
    </div>
  );
}

const CONECTORES = new Set(['de', 'del', 'en', 'y', 'la', 'las', 'el', 'los', 'e']);

/** "Ingeniería en Agua y Desarrollo Sostenible" → "IADS". */
function sigla(nombre: string): string {
  const palabras = nombre.split(/\s+/).filter((p) => p && !CONECTORES.has(p.toLowerCase()));
  return palabras.map((p) => p[0]).join('').toUpperCase().slice(0, 5);
}

/**
 * Materias con más tutorías: agendadas contra asistencias, y su calificación.
 * La misma materia se dicta en varias carreras: la sigla de la carrera va al
 * lado del nombre. Sin asistencias ni opiniones, la tutoría todavía no pasó o
 * no se cargó la asistencia: se muestra en gris, no como "nadie fue".
 */
export function MateriasTutorias({ filas, limite }: Readonly<{ filas: Academico['porMateria']; limite?: number }>) {
  const tema = useTemaGraficos();
  return (
    <Mancuernas
      nombreA="Asistieron"
      nombreB="Agendadas"
      colorA={tema.aprobadas}
      colorB={tema.categorias[0]}
      textoSinA="sin asistencia aún"
      filas={filas.slice(0, limite).map((m) => ({
        clave: m.materiaId,
        nombre: m.nombre,
        chip: m.carreraNombre ? { texto: sigla(m.carreraNombre), titulo: m.carreraNombre } : undefined,
        detalle: `${m.carreraNombre ? `${m.carreraNombre} · ` : ''}${entero(m.tutorias)} ${m.tutorias === 1 ? 'tutoría' : 'tutorías'}`,
        a: Number(m.asistieron),
        b: Number(m.agendadas),
        sinA: Number(m.asistieron) === 0 && m.ratingPromedio == null,
        extra: Number(m.asistieron) === 0 && m.ratingPromedio == null ? undefined : <span className="hidden min-w-[64px] justify-end sm:inline-flex"><Estrellas valor={m.ratingPromedio} chico /></span>,
      }))}
    />
  );
}

/** Eventos del período con su cupo lleno como barra de progreso. */
export function EventosLista({ eventos, limite }: Readonly<{ eventos: Academico['eventosLista']; limite?: number }>) {
  const tema = useTemaGraficos();
  if (eventos.length === 0) return <Vacio texto="No hubo eventos en el período." />;
  return (
    <ul className="space-y-3">
      {eventos.slice(0, limite).map((e) => {
        const cupo = e.cupo == null ? null : Number(e.cupo);
        const inscriptos = Number(e.inscriptos);
        const pct = cupo ? (inscriptos / cupo) * 100 : null;
        const color = pct == null ? tema.categorias[0] : pct >= 100 ? tema.danado : pct >= 70 ? tema.disponible : pct >= 35 ? tema.mantenimiento : tema.vencidas;
        return (
          <li key={e.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium" title={e.titulo}>{e.titulo}</div>
                <div className="flex min-w-0 items-center gap-1 text-2xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {fechaCorta(e.fecha.slice(0, 10))}
                    {e.espacioNombre && ` · ${e.espacioNombre}`}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Estrellas valor={e.ratingPromedio} chico />
              </div>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct ?? 100)}%`, backgroundColor: color, opacity: pct == null ? 0.35 : 1 }} />
              </div>
              <span className="w-24 shrink-0 text-right text-2xs tabular-nums text-muted-foreground">
                <b className="text-foreground">{entero(inscriptos)}</b>
                {cupo != null ? ` / ${entero(cupo)} · ${Math.round(pct ?? 0)}%` : ' inscriptos'}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
