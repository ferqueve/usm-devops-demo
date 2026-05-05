import { useState, useEffect } from "react";
import { RecomendacionPanel } from "./RecomendacionPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, AlertTriangle, Package, Loader2 } from "lucide-react";
import { recomendacionesApi } from "@/lib/api/recomendaciones";
import type { RecomendacionInventario } from "@/lib/types/recomendaciones";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils/helpers";

interface MantenimientoRecomendacionesProps {
  className?: string;
}

export function MantenimientoRecomendaciones({ className }: Readonly<MantenimientoRecomendacionesProps>) {
  const navigate = useNavigate();
  const [itemsUrgentes, setItemsUrgentes] = useState<RecomendacionInventario[]>([]);
  const [espaciosAtencion, setEspaciosAtencion] = useState<RecomendacionInventario[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarRecomendaciones = async () => {
      setLoading(true);
      try {
        const [itemsResponse, espaciosResponse] = await Promise.all([
          recomendacionesApi.obtenerItemsMantenimiento(),
          recomendacionesApi.obtenerEspaciosAtencion(),
        ]);

        if (itemsResponse.success && itemsResponse.data) {
          setItemsUrgentes(itemsResponse.data);
        }
        if (espaciosResponse.success && espaciosResponse.data) {
          setEspaciosAtencion(espaciosResponse.data);
        }
      } catch (error) {
        console.error("Error cargando recomendaciones:", error);
        toast.error("No se pudieron cargar las recomendaciones");
      } finally {
        setLoading(false);
      }
    };

    cargarRecomendaciones();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {itemsUrgentes.length > 0 && (
        <RecomendacionPanel
          title="Items que Requieren Mantenimiento Urgente"
          recomendaciones={itemsUrgentes}
          loading={loading}
          maxItems={5}
          icon={<Wrench className="h-5 w-5 text-amber-600" />}
          emptyMessage="No hay items que requieran mantenimiento urgente"
          onSelect={(rec) => {
            if (rec.inventarioItemId) {
              navigate(`/inventory?itemId=${rec.inventarioItemId}`);
            }
          }}
        />
      )}

      {espaciosAtencion.length > 0 && (
        <RecomendacionPanel
          title="Espacios que Requieren Atención"
          recomendaciones={espaciosAtencion}
          loading={loading}
          maxItems={5}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          emptyMessage="No hay espacios que requieran atención"
          onSelect={(rec) => {
            if (rec.espacioId) {
              navigate(`/rooms/${rec.espacioId}`);
            }
          }}
        />
      )}

      {itemsUrgentes.length === 0 && espaciosAtencion.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay recomendaciones de mantenimiento en este momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

