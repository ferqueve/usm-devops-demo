import { useMemo, type ReactNode } from 'react';
import {
  BookOpen, CalendarClock, CalendarDays, CalendarRange, Radio, Search, Ticket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Evento } from '@/lib/types/eventos';
import { estaEnVivo } from './eventoUtils';
import { EventoCardDescubrir } from './EventoCardDescubrir';

interface EventosDescubrirProps {
  eventos: Evento[]; // ya filtrados (búsqueda/tipo/estado/tag/orden)
  misInscripciones: Evento[];
  hayFiltro: boolean;
  idsInscripto: Set<number>;
  onNavigate: (id: number) => void;
  onInscribirse: (e: Evento) => void;
  onCancelar: (e: Evento) => void;
  onEditar: (e: Evento) => void;
  onEliminar: (e: Evento) => void;
  onTag: (t: string) => void;
  inscribiendo: number | null;
  cancelando: number | null;
}

interface Bucket { id: string; titulo: string; icon: LucideIcon; accent: string; eventos: Evento[] }

export function EventosDescubrir(props: Readonly<EventosDescubrirProps>) {
  const {
    eventos, misInscripciones, hayFiltro, idsInscripto,
    onNavigate, onInscribirse, onCancelar, onEditar, onEliminar, onTag, inscribiendo, cancelando,
  } = props;

  const cardFor = (e: Evento, className: string): ReactNode => (
    <EventoCardDescubrir
      key={e.id}
      evento={e}
      className={className}
      yaInscrito={e.yaInscrito || idsInscripto.has(e.id)}
      onNavigate={onNavigate}
      onInscribirse={onInscribirse}
      onCancelar={onCancelar}
      onEditar={onEditar}
      onEliminar={onEliminar}
      onTag={onTag}
      inscribiendo={inscribiendo === e.id}
      cancelando={cancelando === e.id}
    />
  );

  const buckets: Bucket[] = useMemo(() => {
    const now = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const finHoy = endOfToday.getTime();
    const finSemana = now + 7 * 86400000;

    const vivo: Evento[] = [];
    const hoy: Evento[] = [];
    const semana: Evento[] = [];
    const proximos: Evento[] = [];
    const cursos: Evento[] = [];

    for (const e of eventos) {
      if (e.tipo === 'CURSO' && e.estado !== 'FINALIZADO' && e.estado !== 'CANCELADO') cursos.push(e);
      const start = new Date(e.inicio).getTime();
      if (Number.isNaN(start)) continue;
      if (estaEnVivo(e.inicio, e.fin)) { vivo.push(e); continue; }
      if (start < now) continue; // pasado y no en vivo
      if (start <= finHoy) hoy.push(e);
      else if (start <= finSemana) semana.push(e);
      else proximos.push(e);
    }

    const list: Bucket[] = [
      { id: 'vivo', titulo: 'En vivo ahora', icon: Radio, accent: 'bg-utec-red/10 text-utec-red', eventos: vivo },
      { id: 'hoy', titulo: 'Hoy', icon: CalendarClock, accent: 'bg-utec-cyan/10 text-utec-cyan', eventos: hoy },
      { id: 'semana', titulo: 'Esta semana', icon: CalendarRange, accent: 'bg-utec-blue/10 text-utec-blue', eventos: semana },
      { id: 'proximos', titulo: 'Próximos', icon: CalendarDays, accent: 'bg-utec-green/10 text-utec-green', eventos: proximos },
      { id: 'cursos', titulo: 'Cursos abiertos', icon: BookOpen, accent: 'bg-utec-purple/10 text-utec-purple', eventos: cursos },
    ];
    return list.filter((b) => b.eventos.length > 0);
  }, [eventos]);

  // --- Con filtros activos: grilla de resultados ---
  if (hayFiltro) {
    if (eventos.length === 0) {
      return (
        <div className="py-16 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Ningún evento coincide con los filtros.</p>
        </div>
      );
    }
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="h-4 w-1 shrink-0 rounded-sm bg-utec-cyan" />
          <h2 className="text-base font-semibold">Resultados</h2>
          <span className="text-sm text-muted-foreground">({eventos.length})</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {eventos.map((e) => cardFor(e, 'w-full'))}
        </div>
      </section>
    );
  }

  const hayInscripciones = misInscripciones.length > 0;

  if (buckets.length === 0 && !hayInscripciones) {
    return (
      <div className="py-16 text-center">
        <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No hay eventos próximos por descubrir.</p>
      </div>
    );
  }

  const Rail = ({ children }: Readonly<{ children: ReactNode }>) => (
    <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:thin]">
      {children}
    </div>
  );

  const Header = ({ icon: Icon, accent, titulo, count }: Readonly<{ icon: LucideIcon; accent: string; titulo: string; count: number }>) => (
    <div className="flex items-center gap-2.5">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}><Icon className="h-4 w-4" /></span>
      <h2 className="text-base font-semibold">{titulo}</h2>
      <span className="text-sm text-muted-foreground">({count})</span>
    </div>
  );

  const renderSeccion = (b: Bucket) => (
    <section key={b.id} className="space-y-3">
      <Header icon={b.icon} accent={b.accent} titulo={b.titulo} count={b.eventos.length} />
      <Rail>
        {b.eventos.map((e) => cardFor(e, 'w-[280px] shrink-0 snap-start'))}
      </Rail>
    </section>
  );

  // "Próximos" y "Cursos abiertos" van 50/50 en la misma fila; el resto full-width.
  const fullWidth = buckets.filter((b) => b.id !== 'proximos' && b.id !== 'cursos');
  const pareja = buckets.filter((b) => b.id === 'proximos' || b.id === 'cursos');

  return (
    <div className="space-y-6">
      {hayInscripciones && (
        <section className="space-y-3">
          <Header icon={Ticket} accent="bg-utec-cyan/15 text-utec-cyan" titulo="Mis inscripciones" count={misInscripciones.length} />
          <Rail>
            {misInscripciones.map((e) => cardFor(e, 'w-[280px] shrink-0 snap-start'))}
          </Rail>
        </section>
      )}
      {fullWidth.map(renderSeccion)}
      {pareja.length === 2
        ? <div className="grid gap-6 lg:grid-cols-2">{pareja.map(renderSeccion)}</div>
        : pareja.map(renderSeccion)}
    </div>
  );
}
