import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { espaciosApi } from '@/lib/api/spaces';
import type { Espacio, TipoEspacio } from '@/lib/types/spaces';
import { Loader2, Save, X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDialogScrollLock } from '@/hooks/useDialogScrollLock';

interface SpaceFormDialogProps {
  espacio: Espacio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (espacio: Espacio) => void;
}

export function SpaceFormDialog({ 
  espacio, 
  open, 
  onOpenChange, 
  onSuccess 
}: SpaceFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    capacidad: 1,
    tipoEspacioId: 0,
    imagenUrl: '',
    estado: 'DISPONIBLE' as 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE'
  });
  
  // Prevenir layout shift cuando el modal está abierto
  useDialogScrollLock(open);

  const isEditing = !!espacio;

  // Cargar tipos de espacio al abrir el dialog
  useEffect(() => {
    if (open) {
      fetchTiposEspacio();
    }
  }, [open]);

  // Actualizar formData cuando cambia el espacio
  useEffect(() => {
    if (espacio) {
      setFormData({
        nombre: espacio.nombre,
        capacidad: espacio.capacidad,
        tipoEspacioId: espacio.tipoEspacioId,
        imagenUrl: espacio.imagenUrl || '',
        estado: espacio.estado
      });
      setImagePreview(espacio.imagenUrl || null);
      setSelectedFile(null);
    } else {
      setFormData({
        nombre: '',
        capacidad: 1,
        tipoEspacioId: 0,
        imagenUrl: '',
        estado: 'DISPONIBLE'
      });
      setImagePreview(null);
      setSelectedFile(null);
    }
  }, [espacio]);

  const fetchTiposEspacio = async () => {
    try {
      const response = await espaciosApi.listarTiposEspacio();
      if (response.data) {
        setTiposEspacio(response.data);
      }
    } catch (error) {
      console.error('Error al cargar tipos de espacio:', error);
      toast.error('Error al cargar tipos de espacio');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Use JPG, PNG, WebP o GIF');
      return;
    }

    // Validar tamaño (50MB para imágenes de alta calidad)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Tamaño máximo: 50MB');
      return;
    }

    setSelectedFile(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre?.trim()) {
      toast.error('El nombre del espacio es requerido');
      return;
    }

    if (formData.capacidad < 1) {
      toast.error('La capacidad debe ser mayor a 0');
      return;
    }

    if (formData.tipoEspacioId === 0) {
      toast.error('Debe seleccionar un tipo de espacio');
      return;
    }

    try {
      setLoading(true);
      
      const data = {
        nombre: formData.nombre.trim(),
        capacidad: formData.capacidad,
        tipoEspacioId: formData.tipoEspacioId,
        imagenUrl: formData.imagenUrl.trim() || undefined,
        estado: formData.estado
      };

      let response;
      if (isEditing && espacio) {
        response = await espaciosApi.actualizarEspacio(espacio.id, data);
      } else {
        response = await espaciosApi.crearEspacio(data);
      }

      // Si hay un archivo seleccionado, subirlo después de crear/actualizar el espacio
      if (selectedFile && response.data) {
        try {
          setUploadingImage(true);
          const uploadResponse = await espaciosApi.subirImagenEspacio(response.data.id, selectedFile);
          if (uploadResponse.data) {
            // Actualizar el espacio con la nueva imagen
            response.data.imagenUrl = uploadResponse.data.imageUrl;
            toast.success('Imagen subida exitosamente');
          }
        } catch (uploadError: unknown) {
          console.error('Error al subir imagen:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Intente subir la imagen nuevamente';
          toast.error('Espacio guardado, pero hubo un error al subir la imagen', {
            description: errorMessage
          });
        } finally {
          setUploadingImage(false);
        }
      }
      
      toast.success(
        isEditing ? 'Espacio actualizado' : 'Espacio creado',
        {
          description: `${formData.nombre} ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente`
        }
      );
      
      if (response.data) {
        onSuccess(response.data);
        onOpenChange(false);
      }
    } catch (error: unknown) {
      console.error('Error al guardar espacio:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el espacio';
      toast.error(
        isEditing ? 'Error al actualizar espacio' : 'Error al crear espacio',
        {
          description: errorMessage
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Espacio' : 'Crear Nuevo Espacio'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información del espacio seleccionado.'
              : 'Completa la información para crear un nuevo espacio.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] -mx-6 px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Espacio</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Aula 101"
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoEspacio">Tipo de Espacio</Label>
            <Select
              value={formData.tipoEspacioId === 0 ? "seleccionar" : formData.tipoEspacioId?.toString() || "seleccionar"}
              onValueChange={(value) => {
                if (value !== "seleccionar") {
                  setFormData(prev => ({ ...prev, tipoEspacioId: parseInt(value) }));
                }
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seleccionar" disabled>Seleccionar</SelectItem>
                {tiposEspacio.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacidad">Capacidad</Label>
            <Input
              id="capacidad"
              type="number"
              min="1"
              value={formData.capacidad}
              onChange={(e) => setFormData(prev => ({ ...prev, capacidad: parseInt(e.target.value) || 1 }))}
              placeholder="Ej: 30"
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagen">Imagen del Espacio (Opcional)</Label>
            
            {/* Preview de imagen */}
            {imagePreview && (
              <div className="relative w-full h-48 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                  disabled={loading || uploadingImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Input de archivo */}
            {!imagePreview && (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="imagen"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, WebP o GIF (máx. 50MB)</p>
                  </div>
                  <input
                    id="imagen"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    disabled={loading || uploadingImage}
                  />
                </label>
              </div>
            )}

            {/* Botón para cambiar imagen si ya hay una */}
            {imagePreview && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('imagen') as HTMLInputElement;
                    input?.click();
                  }}
                  disabled={loading || uploadingImage}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {selectedFile ? 'Cambiar Imagen' : 'Cambiar Imagen'}
                </Button>
                <input
                  id="imagen"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  disabled={loading || uploadingImage}
                />
              </div>
            )}

            {uploadingImage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Subiendo imagen...</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, estado: value as 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE' }));
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                <SelectItem value="MANTENIMIENTO">En Mantenimiento</SelectItem>
                <SelectItem value="NO_DISPONIBLE">No Disponible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || uploadingImage}>
            {(loading || uploadingImage) ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {uploadingImage ? 'Subiendo...' : isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
