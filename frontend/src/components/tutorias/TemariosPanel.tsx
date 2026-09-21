import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquareText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { postResumenTemario } from '@/lib/api/ai';
import { tutoriasApi } from '@/lib/api/tutorias';
import { Panel } from '@/components/common/Panel';
import { MARCA } from '@/lib/design/paleta';

interface TemariosPanelProps {
  tutoriaId: number;
  materiaNombre?: string;
  /** Se recarga cuando cambia (p. ej. tras agendar o cancelar alguien). */
  refreshKey?: number;
}

/** Un tema pedido y cuántos estudiantes lo pidieron. */
interface TemaAgrupado {
  texto: string;
  veces: number;
}

/**
 * Palabras que no aportan al agrupar: aparecen en casi todos los pedidos y harían
 * que dos temas distintos se parezcan entre sí.
 */
const VACIAS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'y', 'o', 'a', 'en', 'con',
  'por', 'para', 'que', 'no', 'me', 'mi', 'se', 'lo', 'al', 'es', 'como', 'sobre',
  'entiendo', 'entender', 'repasar', 'repaso', 'ver', 'quiero', 'necesito', 'ayuda',
  'duda', 'dudas', 'tema', 'temas', 'ejercicio', 'ejercicios', 'practico', 'práctico',
]);

function palabrasClave(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 3 && !VACIAS.has(p));
}

/**
 * Agrupa pedidos que hablan de lo mismo aunque estén escritos distinto,
 * comparando sus palabras clave. Es deliberadamente simple: sirve para que el
 * docente vea de un golpe qué se repite, no para clasificar con precisión.
 * El resumen fino lo hace la IA, a pedido.
 */
function agrupar(temarios: string[]): TemaAgrupado[] {
  const grupos: { claves: Set<string>; textos: string[] }[] = [];

  for (const texto of temarios) {
    const claves = new Set(palabrasClave(texto));
    if (claves.size === 0) {
      grupos.push({ claves, textos: [texto] });
      continue;
    }
    const existente = grupos.find((g) => {
      if (g.claves.size === 0) return false;
      let comunes = 0;
      for (const c of claves) if (g.claves.has(c)) comunes++;
      // Comparte al menos la mitad de las palabras clave del pedido más corto.
      return comunes > 0 && comunes >= Math.min(claves.size, g.claves.size) / 2;
    });
    if (existente) {
      existente.textos.push(texto);
      for (const c of claves) existente.claves.add(c);
    } else {
      grupos.push({ claves, textos: [texto] });
    }
  }

  return grupos
    .map((g) => ({
      // Se muestra el pedido más corto del grupo: suele ser el más directo.
      texto: [...g.textos].sort((a, b) => a.length - b.length)[0],
      veces: g.textos.length,
    }))
    .sort((a, b) => b.veces - a.veces || a.texto.localeCompare(b.texto));
}

/**
 * Lo que los estudiantes anotaron que quieren ver, agrupado por tema.
 *
 * El dato ya se guardaba (`TutoriaReserva.temario`, que se pide al agendar) y el
 * endpoint existía, pero ninguna pantalla lo mostraba: el docente llegaba a la
 * tutoría sin saber qué le iban a preguntar.
 */
export function TemariosPanel({ tutoriaId, materiaNombre, refreshKey = 0 }: Readonly<TemariosPanelProps>) {
  const [temarios, setTemarios] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [resumen, setResumen] = useState<string | null>(null);
  const [resumiendo, setResumiendo] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    tutoriasApi.temarios(tutoriaId)
      .then((r) => setTemarios(r.data ?? []))
      .catch(() => setTemarios([]))
      .finally(() => setCargando(false));
  }, [tutoriaId]);

  useEffect(() => { cargar(); }, [cargar, refreshKey]);

  const agrupados = useMemo(() => agrupar(temarios), [temarios]);

  const resumir = async () => {
    setResumiendo(true);
    try {
      const { resumen: texto } = await postResumenTemario({ materia: materiaNombre, temarios });
      if (texto?.trim()) {
        setResumen(texto.trim());
      } else {
        toast.error('El asistente no devolvió un resumen');
      }
    } catch (e: unknown) {
      toast.error('No se pudo generar el resumen', {
        description: e instanceof Error ? e.message : 'El servicio de IA no está disponible',
        duration: 6000,
      });
    } finally {
      setResumiendo(false);
    }
  };

  const cuerpo = () => {
    if (cargando) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (temarios.length === 0) {
      return (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Todavía nadie anotó qué quiere ver. Aparece acá cuando los estudiantes
          escriben un temario al agendar.
        </p>
      );
    }
    return (
      <div className="space-y-4">
        <ul className="space-y-2">
          {agrupados.map((t) => (
            <li
              key={t.texto}
              className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
            >
              <span className="mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-utec-blue px-1.5 text-xs font-bold tabular-nums text-white">
                {t.veces}
              </span>
              <span className="text-sm leading-snug">{t.texto}</span>
            </li>
          ))}
        </ul>

        {resumen ? (
          <div className="rounded-lg border border-utec-purple/30 bg-utec-purple/5 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-utec-purple">
              <Sparkles className="h-3.5 w-3.5" />Resumen del asistente
            </p>
            <p className="text-sm leading-relaxed">{resumen}</p>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={resumir} disabled={resumiendo}>
            {resumiendo
              ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Resumiendo…</>
              : <><Sparkles className="mr-1.5 h-4 w-4 text-utec-purple" />Resumir con IA</>}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Panel
      title="Qué vienen a preguntar"
      icon={<MessageSquareText />}
      accentColor={MARCA.azul}
      count={temarios.length === 0
        ? 'temarios anotados al agendar'
        : `${temarios.length} temario${temarios.length === 1 ? '' : 's'} · ${agrupados.length} tema${agrupados.length === 1 ? '' : 's'}`}
    >
      {cuerpo()}
    </Panel>
  );
}
