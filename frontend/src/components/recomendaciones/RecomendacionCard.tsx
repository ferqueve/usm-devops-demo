import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Info } from "lucide-react";
import type { RecomendacionBase } from "@/lib/types/recomendaciones";
import { cn } from "@/lib/utils/helpers";

interface RecomendacionCardProps {
  recomendacion: RecomendacionBase;
  onSelect?: () => void;
  className?: string;
}

export function RecomendacionCard({ recomendacion, onSelect, className }: Readonly<RecomendacionCardProps>) {
  const getPuntajeColor = (puntaje: number) => {
    if (puntaje >= 0.8) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (puntaje >= 0.6) return "bg-blue-50 text-blue-700 border-blue-200";
    if (puntaje >= 0.4) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200 cursor-pointer",
        onSelect && "hover:border-primary",
        className
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">
              Recomendación
            </CardTitle>
          </div>
          <Badge className={getPuntajeColor(recomendacion.puntaje)}>
            {(recomendacion.puntaje * 100).toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">{recomendacion.razon}</p>
        </div>
      </CardContent>
    </Card>
  );
}

