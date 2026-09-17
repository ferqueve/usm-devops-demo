import { useState } from 'react';
import { Sparkles, Loader2, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { getSemanticSearch, type SemanticSearchResultado } from '@/lib/api/ai';

interface AiSemanticSearchProps {
  onSelectEspacio?: (espacioId: number) => void;
}

export function AiSemanticSearch({ onSelectEspacio }: Readonly<AiSemanticSearchProps>) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<SemanticSearchResultado[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buscar() {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError(null);
    setResultados(null);
    try {
      const res = await getSemanticSearch(q.trim(), 5);
      if (res.success && res.data) {
        setResultados(res.data.resultados);
      } else {
        setError(res.error || 'Sin respuesta');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 gap-1.5 border-utec-blue/40 text-utec-blue hover:bg-utec-blue/10"
          aria-label="Buscar con IA"
        >
          <Sparkles className="h-4 w-4 text-utec-yellow" />
          <span className="hidden md:inline">Buscar con IA</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-3">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-utec-blue" />
              Búsqueda semántica
            </h4>
            <p className="text-xs text-muted-foreground">
              Describí en lenguaje natural qué espacio necesitás.
            </p>
          </div>
          <div className="flex gap-1.5">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ej.: salón grande con proyector"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscar())}
              className="text-sm"
            />
            <Button onClick={buscar} disabled={loading || q.trim().length < 2} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">Error: {error}</p>}
          {resultados && resultados.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin coincidencias.</p>
          )}
          {resultados && resultados.length > 0 && (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto">
              {resultados.map((r) => (
                <li key={r.espacio_id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectEspacio?.(r.espacio_id);
                      setOpen(false);
                    }}
                    className="w-full rounded border bg-muted p-2 text-left text-xs hover:border-utec-blue hover:bg-utec-blue/5"
                  >
                    <div className="flex items-center justify-between font-semibold text-utec-dark">
                      <span>Espacio #{r.espacio_id}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {(r.similitud * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-muted-foreground">{r.texto_indexado}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
