import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { postChat } from '@/lib/api/ai';
import { useAuth } from '@/hooks/useAuth';
import type { Materia } from '@/lib/types/materias';
import type { Recurso } from '@/lib/types/recursos';
import { Panel } from '@/components/common/Panel';

interface MateriaAsistenteProps {
  materia: Materia;
  recursos: Recurso[];
}

export function MateriaAsistente({ materia, recursos }: Readonly<MateriaAsistenteProps>) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [respuesta, setRespuesta] = useState<string | null>(null);

  const contexto = () => {
    const lista = recursos.map((r) => `- ${r.titulo}${r.descripcion ? `: ${r.descripcion}` : ''}`).join('\n');
    return `Materia: ${materia.nombre}${materia.carreraNombre ? ` (${materia.carreraNombre})` : ''}.\n` +
      `${materia.descripcion ? `Descripción: ${materia.descripcion}\n` : ''}` +
      `Recursos académicos:\n${lista || '(sin recursos)'}`;
  };

  const preguntar = async (prompt: string) => {
    try {
      setLoading(true);
      setRespuesta(null);
      const r = await postChat({
        mensaje: `${prompt}\n\n${contexto()}`,
        usuario_id: user?.id ?? 0,
        rol: user?.rol ?? '',
      });
      setRespuesta(r.data?.respuesta ?? 'Sin respuesta.');
    } catch (e: unknown) {
      toast.error('El asistente no está disponible', { description: e instanceof Error ? e.message : 'ai-svc' });
      setRespuesta(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    // El violeta es el acento de las funciones de IA en toda la aplicación.
    // No es de la marca; queda así hasta decidirlo.
    <Panel title="Asistente IA" icon={<Sparkles />} accentColor="#9333ea">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={loading} onClick={() => preguntar('Resumí brevemente de qué tratan los recursos de esta materia.')}>
            Resumir recursos
          </Button>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => preguntar('Generá 5 preguntas de repaso para estudiantes a partir de los recursos de esta materia.')}>
            Preguntas de repaso
          </Button>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Pensando…
          </div>
        )}
        {respuesta && !loading && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap leading-relaxed">{respuesta}</div>
        )}
      </div>
    </Panel>
  );
}
