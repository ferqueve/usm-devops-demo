import { useState } from 'react';
import { ChevronRight, MapPin, Monitor, UserRound } from 'lucide-react';
import type { RiesgoTutoria, TutoriaProximaML } from '@/lib/api/stats';
import { BarrasTramos } from '@/components/statistics/graficos/BarrasTramos';
import { Dona } from '@/components/statistics/graficos/Dona';
import { useTemaGraficos } from '@/components/statistics/graficos/tema';
import { Vacio } from '@/components/statistics/Vacio';
import { Chip } from '../comunes';
import { decimal, entero, fechaCorta, lunes, partesInstante } from '../formato';
import { estiloTutoria, ORDEN_RIESGO } from './estilos';

/**
 * Inscriptos, esperados y cupo en una sola barra. La clara son los inscriptos,
 * la de color los que se espera que vayan, el trazo fino su rango del 80% y la
 * marca vertical el cupo.
 */
export function BarraAsistencia({ t, color }: Readonly<{ t: TutoriaProximaML; color: string }>) {
  const cupo = t.cupo ?? 0;
  const escala = Math.max(1, cupo, t.inscriptos) * 1.04;
  const pos = (v: number) => `${(Math.max(0, v) / escala) * 100}%`;
  return (
    <div className="relative h-4" title={`${entero(t.inscriptos)} inscriptos${t.esperados != null ? ` · ${decimal(t.esperados)} esperados` : ''}${cupo ? ` · cupo ${cupo}` : ''}`}>
      <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-muted" />
      <div className="absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full opacity-30" style={{ width: pos(t.inscriptos), backgroundColor: color }} />
      {t.esperados != null && (
        <div className="absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full" style={{ width: pos(t.esperados), backgroundColor: color }} />
      )}
      {t.bandaInferior != null && t.bandaSuperior != null && t.bandaSuperior > t.bandaInferior && (
        <div
          className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-foreground/60"
          style={{ left: pos(t.bandaInferior), width: `${((t.bandaSuperior - t.bandaInferior) / escala) * 100}%` }}
        />
      )}
      {cupo > 0 && <div className="absolute inset-y-0 w-[2px] -translate-x-1/2 rounded-full bg-foreground" style={{ left: pos(cupo) }} />}
    </div>
  );
}

const FILTROS: Array<{ id: 'todas' | RiesgoTutoria; texto: string }> = [
  { id: 'todas', texto: 'Todas' },
  { id: 'vacia', texto: 'Casi vacías' },
  { id: 'baja', texto: 'Baja' },
  { id: 'alta', texto: 'Se llenan' },
  { id: 'normal', texto: 'Normales' },
  { id: 'sin_prediccion', texto: 'Sin predicción' },
];

/**
 * Las tutorías que vienen, en orden de fecha. Cada fila se abre para ver a los
 * inscriptos con su probabilidad de ir; arriba se filtra por riesgo.
 */
export function ListaProximas({ proximas, onAbrir }: Readonly<{ proximas: TutoriaProximaML[]; onAbrir: (t: TutoriaProximaML) => void }>) {
  const tema = useTemaGraficos();
  const [filtro, setFiltro] = useState<'todas' | RiesgoTutoria>('todas');
  const cuenta = (id: 'todas' | RiesgoTutoria) => (id === 'todas' ? proximas.length : proximas.filter((t) => t.riesgo === id).length);
  const visibles = filtro === 'todas' ? proximas : proximas.filter((t) => t.riesgo === filtro);

  return (
    <div>
      <div className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b bg-card px-3 py-2 [scrollbar-width:thin]" role="radiogroup" aria-label="Filtrar por riesgo">
        {FILTROS.filter((f) => f.id === 'todas' || cuenta(f.id) > 0).map((f) => {
          const activo = f.id === filtro;
          const color = f.id === 'todas' ? undefined : estiloTutoria(f.id, tema).color;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setFiltro(f.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                activo ? 'bg-utec-dark text-white' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
              {f.texto}
              <span className={`tabular-nums ${activo ? 'text-white/70' : ''}`}>{cuenta(f.id)}</span>
            </button>
          );
        })}
      </div>

      <ul className="divide-y">
        {visibles.map((t) => {
          const estilo = estiloTutoria(t.riesgo, tema);
          const cuando = partesInstante(t.inicio);
          const virtual = t.modalidad === 'VIRTUAL';
          return (
            <li key={t.tutoriaId}>
              <button
                type="button"
                onClick={() => onAbrir(t)}
                className="group grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:grid-cols-[52px_minmax(0,1.2fr)_minmax(0,1fr)_auto]"
              >
                <span className="flex flex-col items-center rounded-lg border bg-muted/30 py-1 leading-none">
                  <span className="text-[10px] uppercase text-muted-foreground">{cuando.dia}</span>
                  <span className="text-lg font-bold tabular-nums">{cuando.numero}</span>
                  <span className="text-[10px] text-muted-foreground">{cuando.hora}</span>
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold" title={t.materia}>{t.materia}</span>
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                    {t.docente && <span className="inline-flex min-w-0 items-center gap-0.5"><UserRound className="h-3 w-3 shrink-0" /><span className="truncate">{t.docente}</span></span>}
                    <span className="inline-flex items-center gap-0.5">
                      {virtual ? <Monitor className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {virtual ? 'Virtual' : t.espacio ?? 'Presencial'}
                    </span>
                    {t.tipo && <span className="capitalize">{t.tipo.toLowerCase()}</span>}
                  </span>
                  {/* En celular la barra va debajo del nombre: al costado no entraba. */}
                  <span className="mt-1.5 block sm:hidden">
                    <BarraAsistencia t={t} color={estilo.color} />
                  </span>
                </span>

                <span className="hidden min-w-0 sm:block">
                  <BarraAsistencia t={t} color={estilo.color} />
                  <span className="mt-0.5 block text-[11px] tabular-nums text-muted-foreground">
                    {t.esperados == null ? (
                      <><b className="text-foreground">{entero(t.inscriptos)}</b> inscriptos</>
                    ) : (
                      <><b className="text-foreground">{decimal(t.esperados)}</b> de {entero(t.inscriptos)} inscriptos</>
                    )}
                    {t.cupo != null && ` · cupo ${t.cupo}`}
                  </span>
                </span>

                <span className="flex items-center gap-1">
                  <Chip color={estilo.color} icono={estilo.icono}>{estilo.etiqueta}</Chip>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {visibles.length === 0 && <Vacio texto="No hay tutorías con ese riesgo." />}
    </div>
  );
}

/** Cuántas tutorías hay de cada riesgo. */
export function DonaRiesgo({ proximas, grande = false }: Readonly<{ proximas: TutoriaProximaML[]; grande?: boolean }>) {
  const tema = useTemaGraficos();
  return (
    <Dona
      tamano={grande ? 220 : 116}
      leyendaCentro="tutorías"
      porciones={ORDEN_RIESGO.map((r) => {
        const e = estiloTutoria(r, tema);
        return { nombre: e.etiqueta, valor: proximas.filter((t) => t.riesgo === r).length, color: e.color };
      }).filter((p) => p.valor > 0)}
    />
  );
}

/** Esperados y ausencias esperadas, sumados por semana. */
export function EsperadosPorSemana({ proximas, alto = 150 }: Readonly<{ proximas: TutoriaProximaML[]; alto?: number }>) {
  const tema = useTemaGraficos();
  const semanas = new Map<string, { esperados: number; ausentes: number; tutorias: number }>();
  for (const t of proximas) {
    if (t.esperados == null) continue;
    const clave = lunes(partesInstante(t.inicio).fecha);
    const s = semanas.get(clave) ?? { esperados: 0, ausentes: 0, tutorias: 0 };
    semanas.set(clave, { esperados: s.esperados + t.esperados, ausentes: s.ausentes + Math.max(0, t.inscriptos - t.esperados), tutorias: s.tutorias + 1 });
  }
  if (semanas.size === 0) return <Vacio texto="Ninguna tutoría próxima tiene predicción." />;
  return (
    <BarrasTramos
      alto={alto}
      tramos={[...semanas.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([semana, s]) => ({
          etiqueta: `Sem. ${fechaCorta(semana)}`,
          nota: `${s.tutorias} ${s.tutorias === 1 ? 'tutoría' : 'tutorías'}`,
          segmentos: [
            { nombre: 'Se espera que vayan', valor: Math.round(s.esperados), color: tema.disponible },
            { nombre: 'Se espera que falten', valor: Math.round(s.ausentes), color: tema.vencidas },
          ],
        }))}
    />
  );
}
