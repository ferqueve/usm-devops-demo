import { useState } from 'react';
import {
  FileText,
  FileImage,
  Link as LinkIcon,
  File as FileIcon,
  Plus,
  Trash2,
  Loader2,
  Download,
  FolderOpen,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useRecursos } from '@/hooks/useRecursos';
import { recursosApi } from '@/lib/api/recursos';
import type { Recurso } from '@/lib/types/recursos';
import { RecursoUploadDialog } from './RecursoUploadDialog';

interface RecursosPanelProps {
  materiaId: number;
}

function iconoRecurso(recurso: Recurso) {
  if (recurso.tipo === 'ENLACE') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-utec-cyan/10 text-utec-cyan">
        <LinkIcon className="h-5 w-5" />
      </div>
    );
  }
  const mime = recurso.mimeType ?? '';
  if (mime.startsWith('image/')) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-utec-green/10 text-utec-green">
        <FileImage className="h-5 w-5" />
      </div>
    );
  }
  if (mime === 'application/pdf') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-utec-red/10 text-utec-red">
        <FileText className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-utec-blue/10 text-utec-blue">
      <FileIcon className="h-5 w-5" />
    </div>
  );
}

function formatTamano(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

type RecursoSort = 'reciente' | 'nombre' | 'tamano';

export function RecursosPanel({ materiaId }: Readonly<RecursosPanelProps>) {
  const { recursos, loading, refresh } = useRecursos(materiaId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<RecursoSort>('reciente');

  const archivos = recursos.filter((r) => r.tipo !== 'ENLACE').length;
  const enlaces = recursos.length - archivos;

  const visibles = (() => {
    const q = query.trim().toLowerCase();
    const list = recursos.filter(
      (r) => !q || r.titulo.toLowerCase().includes(q) || (r.descripcion ?? '').toLowerCase().includes(q),
    );
    return [...list].sort((a, b) => {
      if (sortBy === 'nombre') return a.titulo.localeCompare(b.titulo);
      if (sortBy === 'tamano') return (b.tamanoBytes ?? 0) - (a.tamanoBytes ?? 0);
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });
  })();

  const handleEliminar = async (id: number) => {
    try {
      setDeletingId(id);
      await recursosApi.eliminarRecurso(id);
      toast.success('Recurso eliminado');
      await refresh();
    } catch (error: unknown) {
      const description =
        error instanceof Error ? error.message : 'No se pudo eliminar el recurso';
      toast.error('Error al eliminar recurso', { description });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-utec-cyan/10 text-utec-cyan">
          <FolderOpen className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold">Recursos académicos</h3>
        {recursos.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {archivos} archivo{archivos === 1 ? '' : 's'} · {enlaces} enlace{enlaces === 1 ? '' : 's'}
          </span>
        )}
        <PermissionGuard requiredPermission="recurso:crear">
          <Button
            type="button"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="ml-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar recurso
          </Button>
        </PermissionGuard>
      </div>

      <div className="space-y-4 p-4">
      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Cargando recursos...
        </div>
      )}

      {!loading && recursos.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-2">
          <EmptyState
            icon={FolderOpen}
            title="Sin recursos"
            description="Todavía no hay recursos para esta materia."
          />
          <PermissionGuard requiredPermission="recurso:crear">
            <Button type="button" size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar el primero
            </Button>
          </PermissionGuard>
        </div>
      )}

      {!loading && recursos.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recurso…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as RecursoSort)}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reciente">Más recientes</SelectItem>
                <SelectItem value="nombre">Nombre (A-Z)</SelectItem>
                <SelectItem value="tamano">Tamaño</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {visibles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Ningún recurso coincide con la búsqueda.</p>
          ) : (
            <ul className="space-y-2">
          {visibles.map((recurso) => {
            const tamano = formatTamano(recurso.tamanoBytes);
            return (
              <li
                key={recurso.id}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-utec-cyan/40 hover:bg-utec-cyan/5"
              >
                <div className="shrink-0">{iconoRecurso(recurso)}</div>
                <div className="min-w-0 flex-1">
                  <a
                    href={recurso.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-medium hover:underline"
                  >
                    {recurso.titulo}
                  </a>
                  {recurso.descripcion && (
                    <p className="truncate text-sm text-muted-foreground">
                      {recurso.descripcion}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {recurso.tipo === 'ENLACE' ? 'Enlace' : 'Archivo'}
                    {tamano ? ` · ${tamano}` : ''}
                    {recurso.subidoPorNombre ? ` · ${recurso.subidoPorNombre}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    asChild
                    title={recurso.tipo === 'ENLACE' ? 'Abrir enlace' : 'Descargar'}
                  >
                    <a href={recurso.url} target="_blank" rel="noopener noreferrer">
                      {recurso.tipo === 'ENLACE' ? (
                        <LinkIcon className="h-4 w-4" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </a>
                  </Button>
                  <PermissionGuard requiredPermission="recurso:eliminar">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEliminar(recurso.id)}
                      disabled={deletingId === recurso.id}
                      title="Eliminar"
                    >
                      {deletingId === recurso.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </PermissionGuard>
                </div>
              </li>
            );
          })}
            </ul>
          )}
        </>
      )}

      <RecursoUploadDialog
        materiaId={materiaId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
      />
      </div>
    </div>
  );
}
