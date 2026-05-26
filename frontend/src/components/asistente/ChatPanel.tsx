import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { postChat } from '@/lib/api/ai';
import { useAuth } from '@/hooks/useAuth';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  tools?: string[];
}

export function ChatPanel() {
  const { user } = useAuth();
  const [historial, setHistorial] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function enviar() {
    const mensaje = input.trim();
    if (!mensaje || !user) return;
    const userMsg: Msg = { role: 'user', content: mensaje };
    setHistorial((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await postChat({
        mensaje,
        usuario_id: user.id,
        rol: user.rol,
        historial: historial.map((m) => ({ role: m.role, content: m.content })),
      });
      if (res.success && res.data) {
        setHistorial((prev) => [
          ...prev,
          { role: 'assistant', content: res.data!.respuesta, tools: res.data!.tools_invocados },
        ]);
      } else {
        setHistorial((prev) => [
          ...prev,
          { role: 'assistant', content: `[error] ${res.error || 'sin respuesta'}` },
        ]);
      }
    } catch (e) {
      setHistorial((prev) => [...prev, { role: 'assistant', content: `[error] ${e}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chatbot (function calling)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          Hace consultas a la base usando tools de solo lectura. Fase 3 del plan.
        </p>
        <div className="max-h-96 space-y-2 overflow-y-auto rounded border p-3">
          {historial.length === 0 && (
            <p className="text-sm text-gray-400">Sin mensajes aún.</p>
          )}
          {historial.map((m, i) => (
            <div
              key={i}
              className={`rounded p-2 text-sm ${m.role === 'user' ? 'bg-utec-blue/10' : 'bg-gray-50'}`}
            >
              <strong>{m.role === 'user' ? 'Vos' : 'IA'}:</strong> {m.content}
              {m.tools && m.tools.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.tools.map((t, j) => (
                    <span key={j} className="rounded bg-utec-yellow/30 px-2 py-0.5 text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ej.: ¿tengo reservas la próxima semana?"
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
            disabled={loading}
          />
          <Button onClick={enviar} disabled={loading || !input.trim()}>
            {loading ? '…' : 'Enviar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
