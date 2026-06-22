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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
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
    return <LinkIcon className="h-5 w-5 text-blue-500" />;
  }
  const mime = recurso.mimeType ?? '';
  if (mime.startsWith('image/')) {
    return <FileImage className="h-5 w-5 text-green-500" />;
  }
  if (mime === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  return <FileIcon className="h-5 w-5 text-muted-foreground" />;
}

function formatTamano(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function RecursosPanel({ materiaId }: Readonly<RecursosPanelProps>) {
  const { recursos, loading, refresh } = useRecursos(materiaId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recursos académicos</h3>
        <PermissionGuard requiredPermission="recurso:crear">
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar recurso
          </Button>
        </PermissionGuard>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Cargando recursos...
        </div>
      )}

      {!loading && recursos.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="Sin recursos"
          description="Todavía no hay recursos para esta materia."
        />
      )}

      {!loading && recursos.length > 0 && (
        <ul className="space-y-2">
          {recursos.map((recurso) => {
            const tamano = formatTamano(recurso.tamanoBytes);
            return (
              <li
                key={recurso.id}
                className="flex items-center gap-3 rounded-lg border p-3"
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

      <RecursoUploadDialog
        materiaId={materiaId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
      />
    </div>
  );
}
