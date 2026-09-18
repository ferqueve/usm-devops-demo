import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, Loader2, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Panel } from '@/components/dashboard/views/_components/Panel';
import { EmptyState } from '@/components/dashboard/views/_components/EmptyState';
import { getSemanticSearch, type SemanticSearchResultado } from '@/lib/api/ai';
import { MARCA } from '@/lib/design/paleta';

const EJEMPLOS = ['Laboratorio para 20', 'Aula grande con proyector', 'Sala para reunión'];

/**
 * El texto indexado lo arma ai/routes/admin.py como
 * "Espacio X. Capacidad N personas. Tipo T. Edificio E. Estado S.".
 */
function leer(texto: string) {
  const campo = (re: RegExp) => re.exec(texto)?.[1];
  return {
    nombre: campo(/Espacio (.+?)\.(?:\s|$)/),
    capacidad: campo(/Capacidad (\d+)/),
    tipo: campo(/Tipo (.+?)\.(?:\s|$)/),
    edificio: campo(/Edificio (.+?)\.(?:\s|$)/),
  };
}

export function SemanticSearchPanel() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<SemanticSearchResultado[] | null>(null);
  const [error, setError] = useState(false);

  async function buscar(texto = q) {
    const consulta = texto.trim();
    if (consulta.length < 2) return;
    setQ(consulta);
    setLoading(true);
    setError(false);
    try {
      const res = await getSemanticSearch(consulta, 5);
      setOut(res.success && res.data ? res.data.resultados : []);
    } catch {
      setError(true);
      setOut(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel
      title="Encontrá un espacio"
      count="por descripción"
      accentColor={MARCA.cian}
      action={{ label: 'espacios', to: '/rooms' }}
      flush
      className="shrink-0"
    >
      <form
        className="flex gap-2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          buscar();
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ej.: aula con proyector para 30"
          className="text-sm"
        />
        <Button type="submit" size="icon" disabled={loading || q.trim().length < 2} aria-label="Buscar" className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {out === null && !error && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
          {EJEMPLOS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => buscar(e)}
              className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              {e}
            </button>
          ))}
        </div>
      )}
      {error && <EmptyState title="La búsqueda no está disponible ahora." />}
      {out && out.length === 0 && <EmptyState title="Sin espacios parecidos." />}
      {out && out.length > 0 && (
        <div className="divide-y divide-border/60 border-t">
          {out.map((r) => {
            const e = leer(r.texto_indexado);
            const pct = Math.round(Math.max(0, Math.min(1, r.similitud)) * 100);
            return (
              <Link
                key={r.espacio_id}
                to={`/rooms/${r.espacio_id}`}
                className="group flex items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{e.nombre ?? `Espacio #${r.espacio_id}`}</div>
                  <div className="flex items-center gap-2.5 truncate text-xs text-muted-foreground">
                    {e.tipo && e.tipo !== e.nombre && <span>{e.tipo}</span>}
                    {e.capacidad && <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3" />{e.capacidad}</span>}
                    {e.edificio && <span className="inline-flex items-center gap-0.5 truncate"><Building2 className="h-3 w-3" />{e.edificio}</span>}
                  </div>
                </div>
                <div className="w-12 shrink-0 text-right">
                  <div className="text-xs font-semibold tabular-nums">{pct}%</div>
                  <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-utec-cyan" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
