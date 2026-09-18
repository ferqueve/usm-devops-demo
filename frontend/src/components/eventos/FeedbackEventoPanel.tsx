import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, Send, Star } from 'lucide-react';
import { toast } from 'sonner';
import { eventosApi } from '@/lib/api/eventos';
import { Panel } from '@/components/common/Panel';
import { EstadoCarga } from '@/components/common/EstadoCarga';
import { MARCA } from '@/lib/design/paleta';
import type { EventoFeedbackResumen } from '@/lib/types/eventos';
import { soloFecha } from '@/lib/utils/fechas';
import { Estrellas } from '@/components/common/Estrellas';



export function FeedbackEventoPanel({ eventoId }: Readonly<{ eventoId: number }>) {
  const [resumen, setResumen] = useState<EventoFeedbackResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resPage, setResPage] = useState(0);

  const cargar = useCallback(() => {
    setLoading(true);
    setError(null);
    eventosApi.feedback(eventoId)
      .then((r) => {
        if (r.data) {
          setResumen(r.data);
          if (r.data.miRating) setRating(r.data.miRating);
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error de red.'))
      .finally(() => setLoading(false));
  }, [eventoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const enviar = async () => {
    if (rating < 1) { toast.error('Elegí una puntuación de 1 a 5 estrellas'); return; }
    try {
      setEnviando(true);
      const r = await eventosApi.dejarFeedback(eventoId, { rating, comentario: comentario.trim() || undefined });
      if (r.data) {
        setResumen(r.data);
        setComentario('');
        toast.success('¡Gracias por tu valoración!');
      }
    } catch (e: unknown) {
      toast.error('No se pudo enviar la valoración', { description: e instanceof Error ? e.message : 'Error' });
    } finally {
      setEnviando(false);
    }
  };

  // Con `resumen` en null el cuerpo no se dibuja, pero JSX evalúa igual lo
  // que tiene adentro: los valores por defecto evitan que reviente.
  const {
    promedio = 0, total = 0, distribucion = [], miRating, puedeValorar = false, items = [],
  } = resumen ?? ({} as Partial<EventoFeedbackResumen>);
  const maxDist = Math.max(1, ...distribucion);

  return (
    <Panel
      title="Satisfacción"
      icon={<Star />}
      accentColor={MARCA.amarillo}
      count={total > 0 ? `${total} ${total === 1 ? 'valoración' : 'valoraciones'}` : undefined}
      altoCompleto
    >
      <EstadoCarga
        cargando={loading}
        error={error}
        alReintentar={cargar}
        vacio={!resumen}
        textoVacio="No hay datos de satisfacción de este evento."
      >
      <div className="flex flex-1 flex-col gap-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground py-1">Todavía no hay valoraciones de este evento.</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-center shrink-0">
              <div className="text-3xl font-bold tabular-nums leading-none">{promedio.toFixed(1)}</div>
              <div className="mt-1"><Estrellas valor={promedio} conNumero={false} /></div>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = distribucion[n - 1] ?? 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-right text-muted-foreground">{n}</span>
                    <Star className="h-3 w-3 fill-utec-yellow text-marca-amarillo-texto" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-utec-yellow rounded-full" style={{ width: `${(count / maxDist) * 100}%` }} />
                    </div>
                    <span className="w-5 text-muted-foreground tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Formulario de valoración (solo si asististe y el evento finalizó) */}
        {puedeValorar && (
          <div className="rounded-xl border border-dashed p-3 space-y-2.5">
            <p className="text-sm font-medium">{miRating ? 'Editá tu valoración' : '¿Cómo estuvo el evento?'}</p>
            <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} className="p-0.5" aria-label={`${n} estrellas`}>
                  <Star className={`h-7 w-7 transition-colors ${n <= (hover || rating) ? 'fill-utec-yellow text-marca-amarillo-texto' : 'text-muted-foreground/40'}`} />
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Dejá un comentario (opcional)"
              disabled={enviando}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
            <Button size="sm" onClick={enviar} disabled={enviando || rating < 1}>
              {enviando ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
              {miRating ? 'Actualizar' : 'Enviar valoración'}
            </Button>
          </div>
        )}

        {/* Comentarios */}
        {(() => {
          const comentarios = items.filter((i) => i.comentario);
          if (comentarios.length === 0) return null;
          const PAGE = 6;
          const totalPag = Math.max(1, Math.ceil(comentarios.length / PAGE));
          const pag = Math.min(resPage, totalPag - 1);
          return (
          <div className="flex flex-1 flex-col gap-2.5">
          <ul className="space-y-2.5">
            {comentarios.slice(pag * PAGE, pag * PAGE + PAGE).map((i) => (
              <li key={i.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate text-sm font-medium">{i.usuarioNombre ?? 'Anónimo'}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <Estrellas valor={i.rating} conNumero={false} />
                    <span className="text-2xs text-muted-foreground">{soloFecha(i.createdAt, '')}</span>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{i.comentario}</p>
              </li>
            ))}
          </ul>
          {totalPag > 1 && (
            <div className="mt-auto flex items-center justify-center gap-3 border-t pt-3">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={pag === 0} onClick={() => setResPage(pag - 1)} aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs text-muted-foreground tabular-nums">Página {pag + 1} de {totalPag}</span>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={pag >= totalPag - 1} onClick={() => setResPage(pag + 1)} aria-label="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
          </div>
          );
        })()}
      </div>
      </EstadoCarga>
    </Panel>
  );
}
