import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { ExternalLink, FileText, Link2, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { tutoriasApi } from '@/lib/api/tutorias';
import type { TutoriaRecurso } from '@/lib/types/tutorias';

export function TutoriaRecursosPanel({ tutoriaId, canEdit }: Readonly<{ tutoriaId: number; canEdit: boolean }>) {
  const [recursos, setRecursos] = useState<TutoriaRecurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    tutoriasApi.recursos(tutoriaId).then((r) => setRecursos(r.data ?? [])).catch(() => { /* noop */ }).finally(() => setLoading(false));
  }, [tutoriaId]);
  useEffect(() => { cargar(); }, [cargar]);

  const agregar = async () => {
    if (!titulo.trim() || !url.trim()) { toast.error('Completá título y enlace'); return; }
    try {
      setGuardando(true);
      const r = await tutoriasApi.agregarRecurso(tutoriaId, { titulo: titulo.trim(), url: url.trim() });
      if (r.data) { setRecursos((p) => [...p, r.data as TutoriaRecurso]); setTitulo(''); setUrl(''); toast.success('Recurso agregado'); }
    } catch (e: unknown) { toast.error('No se pudo agregar', { description: e instanceof Error ? e.message : 'Error' }); }
    finally { setGuardando(false); }
  };
  const eliminar = async (id: number) => {
    try { await tutoriasApi.eliminarRecurso(id); setRecursos((p) => p.filter((x) => x.id !== id)); }
    catch (e: unknown) { toast.error('No se pudo eliminar', { description: e instanceof Error ? e.message : 'Error' }); }
  };

  if (loading) return <div className="rounded-2xl border bg-card p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!canEdit && recursos.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-utec-blue/10"><FileText className="h-4 w-4 text-marca-azul-texto" /></span>
        <h3 className="text-sm font-semibold">Material de la tutoría</h3>
      </div>
      <div className="p-4 space-y-3">
        {recursos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay material adjunto.</p>
        ) : (
          <ul className="space-y-2">
            {recursos.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 text-sm text-marca-azul-texto hover:underline">
                  <Link2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{r.titulo}</span><ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                </a>
                {canEdit && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => eliminar(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
              </li>
            ))}
          </ul>
        )}
        {canEdit && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="h-8 flex-1 min-w-[120px]" disabled={guardando} />
            <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} className="h-8 flex-1 min-w-[140px]" disabled={guardando} />
            <Button size="sm" className="h-8" onClick={agregar} disabled={guardando}>{guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
