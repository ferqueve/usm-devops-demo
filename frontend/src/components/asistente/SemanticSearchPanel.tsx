import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { getSemanticSearch, postReindexEmbeddings, type SemanticSearchResultado } from '@/lib/api/ai';

export function SemanticSearchPanel() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [out, setOut] = useState<SemanticSearchResultado[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buscar() {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError(null);
    setOut(null);
    try {
      const res = await getSemanticSearch(q.trim(), 5);
      if (res.success && res.data) {
        setOut(res.data.resultados);
      } else {
        setError(res.error || 'Sin respuesta');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function reindex() {
    setReindexing(true);
    try {
      const res = await postReindexEmbeddings();
      if (res.success && res.data) {
        alert(`Reindex OK: ${res.data.indexed} espacios (${res.data.model})`);
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (e) {
      alert(String(e));
    } finally {
      setReindexing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Búsqueda semántica de espacios (RAG)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          Busca espacios en lenguaje natural usando embeddings vectoriales (pgvector).
        </p>
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ej.: salón grande con proyector para taller de 30 personas"
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
          />
          <Button onClick={buscar} disabled={loading}>
            {loading ? '…' : 'Buscar'}
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={reindex} disabled={reindexing}>
          {reindexing ? 'Reindexando…' : 'Reindexar embeddings (admin)'}
        </Button>
        {out && (
          <ul className="space-y-2">
            {out.map((r) => (
              <li key={r.espacio_id} className="rounded bg-gray-50 p-3 text-sm">
                <span className="font-semibold">#{r.espacio_id}</span> · similitud {r.similitud.toFixed(3)}
                <p className="text-gray-600">{r.texto_indexado}</p>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
