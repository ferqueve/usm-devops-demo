import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2, RotateCcw, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/common/Panel';
import { cn } from '@/lib/utils/helpers';
import { useAuth } from '@/hooks/useAuth';
import { herramienta } from './herramientas';
import { Atajos } from './Atajos';
import { useChat } from './useChat';

/** **negrita** dentro de una línea. */
function inline(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? (
      <strong key={i} className="font-semibold">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      parte
    ),
  );
}

/**
 * El prompt del chatbot pide enumeraciones con guiones y alguna negrita: con
 * eso alcanza, no hace falta un parser de markdown entero.
 */
function Contenido({ texto }: Readonly<{ texto: string }>) {
  const bloques: ReactNode[] = [];
  let items: string[] = [];
  const cerrarLista = () => {
    if (items.length === 0) return;
    bloques.push(
      <ul key={bloques.length} className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-utec-yellow" />
            <span>{inline(it)}</span>
          </li>
        ))}
      </ul>,
    );
    items = [];
  };
  for (const linea of texto.split('\n')) {
    const item = /^\s*[-*•]\s+(.*)$/.exec(linea);
    if (item) {
      items.push(item[1]);
      continue;
    }
    cerrarLista();
    if (linea.trim()) bloques.push(<p key={bloques.length}>{inline(linea)}</p>);
  }
  cerrarLista();
  return <div className="space-y-2">{bloques}</div>;
}

function AvatarIA({ grande = false }: Readonly<{ grande?: boolean }>) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center bg-chrome',
        grande ? 'h-12 w-12 rounded-xl' : 'h-7 w-7 rounded-lg',
      )}
    >
      <Sparkles className={cn('text-marca-amarillo-texto', grande ? 'h-6 w-6' : 'h-3.5 w-3.5')} />
    </span>
  );
}

export function ChatPanel() {
  const { historial, loading, enviar, reiniciar } = useChat();
  const { user } = useAuth();
  const nombre = user?.nombre?.split(' ')[0];
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sin mensajes no se baja: la bienvenida se lee desde arriba.
  useEffect(() => {
    if (historial.length === 0) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [historial, loading]);

  // El textarea crece con el texto hasta un tope.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  async function mandar() {
    const texto = input;
    if (!texto.trim() || loading) return;
    setInput('');
    await enviar(texto);
    inputRef.current?.focus();
  }

  const preguntas = historial.filter((m) => m.role === 'user').length;

  return (
    <Panel
      title="Conversación"
      count={preguntas > 0 ? `${preguntas} ${preguntas === 1 ? 'consulta' : 'consultas'}` : 'datos en vivo'}
      accentColor="#9333ea"
      flush
      className="h-[75svh] lg:h-auto"
    >
      <div className="flex h-full flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
          {historial.length === 0 ? (
            <div className="flex min-h-full">
              <div className="m-auto flex w-full max-w-3xl flex-col items-center gap-5 py-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <AvatarIA grande />
                  <h2 className="m-0 text-xl font-semibold tracking-tight">
                    {nombre ? `${nombre}, ¿qué necesitás saber?` : '¿Qué necesitás saber?'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Consulto reservas, espacios, inventario y estadísticas con los datos del sistema.
                  </p>
                </div>
                <Atajos onPreguntar={enviar} disabled={loading} />
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {historial.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-utec-blue px-3.5 py-2 text-sm text-white">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex items-start gap-2.5">
                    <AvatarIA />
                    <div className="min-w-0 max-w-[85%] space-y-1.5">
                      <div
                        className={cn(
                          'rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed',
                          m.error ? 'border-utec-red/30 bg-utec-red/5 text-marca-rojo-texto' : 'bg-muted/40',
                        )}
                      >
                        <Contenido texto={m.content} />
                      </div>
                      {m.tools && m.tools.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-2xs text-muted-foreground">consultó</span>
                          {[...new Set(m.tools)].map((t) => {
                            const h = herramienta(t);
                            return (
                              <span
                                key={t}
                                className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground"
                              >
                                <h.icon className="h-3 w-3" />
                                {h.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
              {loading && (
                <div className="flex items-center gap-2.5">
                  <AvatarIA />
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> consultando…
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            {historial.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={reiniciar}
                disabled={loading}
                aria-label="Nueva conversación"
                title="Nueva conversación"
                className="shrink-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  mandar();
                }
              }}
              placeholder="Escribí tu pregunta…"
              className="min-h-9 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button onClick={mandar} disabled={loading || !input.trim()} className="shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="ml-1.5 hidden sm:inline">Enviar</span>
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
