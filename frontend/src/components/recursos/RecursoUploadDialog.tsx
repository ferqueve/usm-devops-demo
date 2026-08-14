import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, X, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { recursosApi } from '@/lib/api/recursos';

interface RecursoUploadDialogProps {
  materiaId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type TabValue = 'archivo' | 'enlace';

export function RecursoUploadDialog({
  materiaId,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<RecursoUploadDialogProps>) {
  const [tab, setTab] = useState<TabValue>('archivo');
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setTab('archivo');
      setTitulo('');
      setDescripcion('');
      setUrl('');
      setFile(null);
    }
  }, [open]);

  const subirArchivo = async () => {
    if (!file) {
      toast.error('Selecciona un archivo');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('titulo', titulo.trim());
    if (descripcion.trim()) {
      formData.append('descripcion', descripcion.trim());
    }
    await recursosApi.subirArchivo(materiaId, formData);
  };

  const crearEnlace = async () => {
    if (!url.trim()) {
      toast.error('La URL es requerida');
      throw new Error('URL requerida');
    }
    await recursosApi.crearEnlace(materiaId, {
      titulo: titulo.trim(),
      url: url.trim(),
      descripcion: descripcion.trim() || undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }
    if (tab === 'archivo' && !file) {
      toast.error('Selecciona un archivo');
      return;
    }
    if (tab === 'enlace' && !url.trim()) {
      toast.error('La URL es requerida');
      return;
    }

    try {
      setLoading(true);
      if (tab === 'archivo') {
        await subirArchivo();
      } else {
        await crearEnlace();
      }
      toast.success('Recurso agregado');
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const description =
        error instanceof Error ? error.message : 'No se pudo agregar el recurso';
      toast.error('Error al agregar recurso', { description });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (loading ? undefined : onOpenChange(value))}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-utec-cyan/10 text-utec-cyan">
              <FolderPlus className="h-4 w-4" />
            </span>
            Agregar recurso
          </DialogTitle>
          <DialogDescription>
            Sube un archivo o comparte un enlace para esta materia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
            <TabsList className="w-full">
              <TabsTrigger value="archivo" className="flex-1">
                Archivo
              </TabsTrigger>
              <TabsTrigger value="enlace" className="flex-1">
                Enlace
              </TabsTrigger>
            </TabsList>

            <TabsContent value="archivo" className="space-y-2 pt-3">
              <Label htmlFor="recurso-file">Archivo</Label>
              <Input
                id="recurso-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={loading}
              />
            </TabsContent>

            <TabsContent value="enlace" className="space-y-2 pt-3">
              <Label htmlFor="recurso-url">URL</Label>
              <Input
                id="recurso-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                disabled={loading}
              />
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="recurso-titulo">Título</Label>
            <Input
              id="recurso-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Apuntes de la unidad 1"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurso-descripcion">Descripción (opcional)</Label>
            <Textarea
              id="recurso-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción del recurso"
              disabled={loading}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
