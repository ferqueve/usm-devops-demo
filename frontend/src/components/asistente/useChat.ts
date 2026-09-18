import { useState } from 'react';
import { postChat } from '@/lib/api/ai';
import { useAuth } from '@/hooks/useAuth';

export interface Msg {
  role: 'user' | 'assistant';
  content: string;
  tools?: string[];
  /** Mensaje de falla: se muestra pero no viaja en el historial. */
  error?: boolean;
}

/** Estado de la conversación y envío de mensajes al chatbot. */
export function useChat() {
  const { user } = useAuth();
  const [historial, setHistorial] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  async function enviar(texto: string) {
    const mensaje = texto.trim();
    if (!mensaje || !user || loading) return;
    const previo = historial;
    setHistorial([...previo, { role: 'user', content: mensaje }]);
    setLoading(true);
    try {
      const res = await postChat({
        mensaje,
        usuario_id: user.id,
        rol: user.rol,
        historial: previo.filter((m) => !m.error && m.content).map((m) => ({ role: m.role, content: m.content })),
      });
      const respuesta = res.data?.respuesta;
      setHistorial((prev) => [
        ...prev,
        res.success && respuesta
          ? { role: 'assistant', content: respuesta, tools: res.data!.tools_invocados }
          : { role: 'assistant', content: 'No pude responderte ahora. Probá de nuevo en un momento.', error: true },
      ]);
    } catch {
      setHistorial((prev) => [
        ...prev,
        { role: 'assistant', content: 'El asistente no está disponible en este momento.', error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return { historial, loading, enviar, reiniciar: () => setHistorial([]) };
}
