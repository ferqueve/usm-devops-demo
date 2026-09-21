import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { recomendacionesApi } from "@/lib/api/recomendaciones";
import type { RecomendacionAnalista } from "@/lib/types/recomendaciones";
import { toast } from "sonner";
import { cn } from "@/lib/utils/helpers";

interface AnalistaRecomendadoProps {
  docenteId: number;
  onSelectAnalista?: (analistaId: number) => void;
  analistaSeleccionadoId?: number;
  className?: string;
}

export function AnalistaRecomendado({
  docenteId,
  onSelectAnalista,
  analistaSeleccionadoId,
  className,
}: Readonly<AnalistaRecomendadoProps>) {
  const [analistas, setAnalistas] = useState<RecomendacionAnalista[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!docenteId) return;

    const cargarAnalistas = async () => {
      setLoading(true);
      try {
        const response = await recomendacionesApi.obtenerAnalistaRecomendado(docenteId);
        if (response.success && response.data) {
          setAnalistas(response.data);
        }
      } catch (error) {
        console.error("Error cargando analistas:", error);
        toast.error("No se pudieron cargar los analistas recomendados");
      } finally {
        setLoading(false);
      }
    };

    cargarAnalistas();
  }, [docenteId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (analistas.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Analistas Recomendados</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analistas.slice(0, 3).map((analista) => {
            const isSelected = analistaSeleccionadoId === analista.analistaId;
            return (
              <button
                type="button"
                key={analista.analistaId}
                className={cn(
                  "w-full text-left flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary/5 border-primary"
                    : "hover:bg-muted border-border"
                )}
                onClick={() => onSelectAnalista?.(analista.analistaId!)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{analista.analistaNombre}</p>
                    <p className="text-xs text-muted-foreground">{analista.analistaEmail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {analista.cargaTrabajoActual || 0} pendientes
                      </Badge>
                      {analista.tasaAprobacion !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {(analista.tasaAprobacion * 100).toFixed(0)}% aprobación
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn((() => {
                      if (analista.puntaje >= 0.8) return "bg-success-suave text-success-texto";
                      if (analista.puntaje >= 0.6) return "bg-info-suave text-info-texto";
                      return "bg-warning-suave text-warning-texto";
                    })())}
                  >
                    {(analista.puntaje * 100).toFixed(0)}%
                  </Badge>
                  {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
        {analistas.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {analistas[0].razon}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

