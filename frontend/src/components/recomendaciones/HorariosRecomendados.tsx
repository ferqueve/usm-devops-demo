import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Clock, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { recomendacionesApi } from "@/lib/api/recomendaciones";
import type { HorarioRecomendado } from "@/lib/types/recomendaciones";
import { toast } from "sonner";
import { cn } from "@/lib/utils/helpers";

interface HorariosRecomendadosProps {
  espacioId: number;
  fecha: Date;
  onSelectHorario?: (inicio: string, fin: string) => void;
  horarioSeleccionado?: { inicio: string; fin: string };
  className?: string;
}

export function HorariosRecomendados({
  espacioId,
  fecha,
  onSelectHorario,
  horarioSeleccionado,
  className,
}: HorariosRecomendadosProps) {
  const [horarios, setHorarios] = useState<HorarioRecomendado[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarHorarios = async () => {
      if (!espacioId || !fecha) return;
      
      setLoading(true);
      try {
        const fechaISO = fecha.toISOString();
        const response = await recomendacionesApi.obtenerHorariosOptimos({
          espacioId,
          fecha: fechaISO,
        });
        if (response.success && response.data) {
          setHorarios(response.data);
        }
      } catch (error) {
        console.error("Error cargando horarios:", error);
        toast.error("No se pudieron cargar los horarios recomendados");
      } finally {
        setLoading(false);
      }
    };

    cargarHorarios();
  }, [espacioId, fecha]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (horarios.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>Horarios Recomendados</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {horarios.slice(0, 6).map((horario, index) => {
          const inicioDate = new Date(horario.inicio);
          const finDate = new Date(horario.fin);
          const isSelected =
            horarioSeleccionado &&
            horarioSeleccionado.inicio === horario.inicio &&
            horarioSeleccionado.fin === horario.fin;

          return (
            <Button
              key={index}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "h-auto py-2 px-3 flex flex-col items-start justify-center",
                isSelected && "bg-primary text-primary-foreground"
              )}
              onClick={() => onSelectHorario?.(horario.inicio, horario.fin)}
            >
              <div className="flex items-center gap-2 w-full">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {inicioDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {finDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {horario.disponible && (
                  <CheckCircle className="h-3 w-3 ml-auto text-emerald-600" />
                )}
              </div>
              {horario.puntaje > 0.7 && (
                <Badge
                  variant="outline"
                  className="mt-1 text-xs"
                  style={{
                    backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : undefined,
                  }}
                >
                  {(horario.puntaje * 100).toFixed(0)}% relevancia
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

