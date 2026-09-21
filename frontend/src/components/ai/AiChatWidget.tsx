import { useEffect, useRef, useState } from 'react';
import { MessageSquareText, Sparkles, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { postChat } from '@/lib/api/ai';
import { cn } from '@/lib/utils/helpers';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  tools?: string[];
}

export function AiChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [historial, setHistorial] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historial, open]);

  if (!user) return null;

  async function enviar() {
    const mensaje = input.trim();
    if (!mensaje || !user) return;
    const userMsg: Msg = { role: 'user', content: mensaje };
    setHistorial((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      // Filtramos mensajes sin content (defensive: el backend rechaza historial mal formado).
      const historialLimpio = historial
        .filter((m) => typeof m.content === 'string' && m.content.length > 0)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await postChat({
        mensaje,
        usuario_id: user.id,
        rol: user.rol,
        historial: historialLimpio,
      });
      if (res.success && res.data && typeof res.data.respuesta === 'string' && res.data.respuesta.length > 0) {
        setHistorial((prev) => [
          ...prev,
          { role: 'assistant', content: res.data!.respuesta, tools: res.data!.tools_invocados },
        ]);
      } else {
        // En caso de error, mostramos algo amigable pero no lo agregamos al historial
        // que se manda al backend (queda solo del lado del cliente, vía un mensaje system-like).
        setHistorial((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Tuve un problema técnico para responderte. Probá reformular tu pregunta en un momento.',
          },
        ]);
      }
    } catch (e) {
      setHistorial((prev) => [...prev, { role: 'assistant', content: `[error] ${e}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-chrome px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-utec-blue"
          aria-label="Abrir asistente IA"
        >
          <Sparkles className="h-5 w-5 text-marca-amarillo-texto" />
          <span className="hidden text-sm font-medium sm:inline">Asistente</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(560px,calc(100vh-2.5rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl">
          <header className="flex items-center justify-between gap-2 bg-chrome px-3 py-2 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-marca-amarillo-texto" />
              <h3 className="text-sm font-semibold">Asistente IA</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 hover:bg-white/10"
              aria-label="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-muted p-3">
            {historial.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <MessageSquareText className="h-8 w-8 text-marca-cian-texto/40" />
                <p className="max-w-[240px]">
                  Preguntá por tus reservas, espacios disponibles o estadísticas.
                </p>
              </div>
            )}
            {historial.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-lg p-2 text-sm',
                  m.role === 'user'
                    ? 'ml-6 bg-utec-blue text-white'
                    : 'mr-6 bg-card border border-border',
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.tools && m.tools.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {m.tools.map((t, j) => (
                      <span
                        key={j}
                        className="rounded bg-utec-yellow/40 px-1.5 py-0.5 text-2xs font-mono text-marca-tinta"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="mr-6 flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> pensando…
              </div>
            )}
          </div>

          <div className="border-t bg-card p-2">
            <div className="flex gap-1.5">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribí tu pregunta…"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviar())}
                disabled={loading}
                className="text-sm"
              />
              <Button onClick={enviar} disabled={loading || !input.trim()} size="sm" aria-label="Enviar">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
