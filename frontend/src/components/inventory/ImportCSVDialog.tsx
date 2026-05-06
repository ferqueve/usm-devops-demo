import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ImportCSVDialog({ 
  open, 
  onOpenChange, 
  onSuccess: _onSuccess
}: Readonly<ImportCSVDialogProps>) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [errors] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar que sea CSV
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('El archivo debe ser un CSV');
      return;
    }

    setFile(selectedFile);
    setPreview(null);

    // Leer y mostrar preview
    const content = await selectedFile.text();
    const lines = content.split('\n').slice(0, 6); // Primeras 5 líneas
    const previewData = lines.map(line => line.split(','));
    setPreview(previewData);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Debe seleccionar un archivo');
      return;
    }

    // La importación CSV todavía está en desarrollo (ver backlog).
    toast.info('Importación CSV en desarrollo', {
      description: 'Esta funcionalidad estará disponible próximamente'
    });
    onOpenChange(false);
    _onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Inventario desde CSV</DialogTitle>
          <DialogDescription>
            Selecciona un archivo CSV con el formato correcto para importar items de inventario
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Upload de archivo */}
          <div className="space-y-2">
            <Label htmlFor="file">Archivo CSV</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <Badge variant="outline" className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  {file.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <Label>Vista previa (primeras 5 líneas)</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview[0]?.map((header, i) => (
                        <th key={`header-${header.trim()}-${i}`} className="px-3 py-2 text-left font-medium text-gray-700">
                          {header.trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.slice(1).map((row, i) => (
                      <tr key={`row-${i}-${row.join('|')}`}>
                        {row.map((cell, j) => (
                          <td key={`cell-${preview[0]?.[j]?.trim() ?? j}-${cell}`} className="px-3 py-2 text-gray-600">
                            {cell.trim()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errores */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                Errores encontrados
              </Label>
              <div className="border border-destructive rounded-lg p-3 bg-destructive/10">
                <ul className="list-disc list-inside text-sm space-y-1">
                  {errors.map((error, i) => (
                    <li key={`error-${i}-${error}`} className="text-destructive">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-900">Formato requerido:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>El CSV debe contener encabezados en la primera fila</li>
                  <li>Columnas: Espacio, Tipo Elemento, Cantidad, Marca, Modelo, Serie, Estado, Valor</li>
                  <li>Estado debe ser: DISPONIBLE, MANTENIMIENTO o DANADO</li>
                  <li>El archivo debe usar encoding UTF-8</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <PermissionGuard requiredPermission="inventario:crear">
              <Button 
                onClick={handleImport} 
                disabled={!file}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
            </PermissionGuard>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
