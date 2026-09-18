import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles, Loader2 } from "lucide-react";
import { recomendacionesApi } from "@/lib/api/recomendaciones";
import type { RecomendacionEspacio } from "@/lib/types/recomendaciones";
import { toast } from "sonner";
import { cn } from "@/lib/utils/helpers";

interface EspaciosRecomendadosProps {
  inicio: string; // ISO datetime
  fin: string; // ISO datetime
  capacidad?: number;
  onSelectEspacio?: (espacioId: number) => void;
  espacioSeleccionadoId?: number;
  className?: string;
}

export function EspaciosRecomendados({
  inicio,
  fin,
  capacidad,
  onSelectEspacio,
  espacioSeleccionadoId,
  className,
}: Readonly<EspaciosRecomendadosProps>) {
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionEspacio[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarRecomendaciones = async () => {
      setLoading(true);
      try {
        const response = await recomendacionesApi.obtenerRecomendacionesEspacios({
          inicio,
          fin,
          capacidad,
        });
        if (response.success && response.data) {
          setRecomendaciones(response.data);
        }
      } catch (error) {
        console.error("Error cargando recomendaciones:", error);
        toast.error("No se pudieron cargar las recomendaciones");
      } finally {
        setLoading(false);
      }
    };

    if (inicio && fin) {
      cargarRecomendaciones();
    }
  }, [inicio, fin, capacidad]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (recomendaciones.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>Espacios Recomendados</span>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {recomendaciones.slice(0, 4).map((rec) => (
          <Card
            key={rec.espacioId}
            className={cn(
              "hover:shadow-md transition-all cursor-pointer border-2",
              espacioSeleccionadoId === rec.espacioId
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50"
            )}
            onClick={() => onSelectEspacio?.(rec.espacioId)}
            style={{
              borderTop: rec.tipoEspacioColor ? `4px solid ${rec.tipoEspacioColor}` : undefined,
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{rec.espacioNombre}</h4>
                  {rec.tipoEspacioNombre && (
                    <Badge
                      variant="outline"
                      className="mt-1 text-xs"
                      style={{
                        borderColor: rec.tipoEspacioColor,
                        color: rec.tipoEspacioColor,
                      }}
                    >
                      {rec.tipoEspacioNombre}
                    </Badge>
                  )}
                </div>
                <Badge
                  className={cn(
                    "ml-2",
                    (() => {
                      if (rec.puntaje >= 0.8) return "bg-success-suave text-success-texto";
                      if (rec.puntaje >= 0.6) return "bg-info-suave text-info-texto";
                      return "bg-warning-suave text-warning-texto";
                    })()
                  )}
                >
                  {(rec.puntaje * 100).toFixed(0)}%
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{rec.capacidad} personas</span>
                </div>
                {rec.disponible && (
                  <Badge variant="outline" className="bg-success-suave text-success-texto border-success-borde">
                    Disponible
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{rec.razon}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

