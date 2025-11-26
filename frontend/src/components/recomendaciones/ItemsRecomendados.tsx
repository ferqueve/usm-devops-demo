import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Package, Sparkles, Loader2, Plus, CheckCircle } from "lucide-react";
import { recomendacionesApi } from "@/lib/api/recomendaciones";
import type { RecomendacionItem } from "@/lib/types/recomendaciones";
import { toast } from "sonner";
import { cn } from "@/lib/utils/helpers";

interface ItemsRecomendadosProps {
  espacioId: number;
  onSelectItem?: (tipoElementoId: number, cantidad: number) => void;
  itemsSeleccionados?: Set<number>; // IDs de tipos de elemento ya seleccionados
  className?: string;
}

export function ItemsRecomendados({
  espacioId,
  onSelectItem,
  itemsSeleccionados = new Set(),
  className,
}: ItemsRecomendadosProps) {
  const [items, setItems] = useState<RecomendacionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!espacioId) return;

    const cargarItems = async () => {
      setLoading(true);
      try {
        const response = await recomendacionesApi.obtenerItemsParaReserva(espacioId);
        if (response.success && response.data) {
          setItems(response.data);
        }
      } catch (error) {
        console.error("Error cargando items recomendados:", error);
        toast.error("No se pudieron cargar los items recomendados");
      } finally {
        setLoading(false);
      }
    };

    cargarItems();
  }, [espacioId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Items Recomendados</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.slice(0, 5).map((item) => {
            const yaSeleccionado = itemsSeleccionados.has(item.tipoElementoId);
            return (
              <div
                key={item.tipoElementoId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  yaSeleccionado
                    ? "bg-emerald-50 border-emerald-200"
                    : "hover:bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.tipoElementoNombre}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.razon}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.disponible !== false && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {item.cantidadDisponible || "Disponible"}
                    </Badge>
                  )}
                  {yaSeleccionado ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => onSelectItem?.(item.tipoElementoId, item.cantidadRecomendada || 1)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

