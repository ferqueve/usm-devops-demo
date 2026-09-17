import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Sparkles, Info, Loader2, Wand2 } from "lucide-react";
import type { RecomendacionBase } from "@/lib/types/recomendaciones";
import { cn } from "@/lib/utils/helpers";
import { postExplainRecomendacion } from "@/lib/api/ai";

interface RecomendacionCardProps {
  recomendacion: RecomendacionBase;
  onSelect?: () => void;
  className?: string;
}

export function RecomendacionCard({ recomendacion, onSelect, className }: Readonly<RecomendacionCardProps>) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplicacion, setAiExplicacion] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const getPuntajeColor = (puntaje: number) => {
    if (puntaje >= 0.8) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (puntaje >= 0.6) return "bg-blue-50 text-blue-700 border-blue-200";
    if (puntaje >= 0.4) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-muted text-foreground/80 border-border";
  };

  const handleExplicar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await postExplainRecomendacion({
        recomendacion: {
          tipo: recomendacion.tipoRecomendacion,
          puntaje: recomendacion.puntaje,
          razon: recomendacion.razon,
          ...(recomendacion.metadata ?? {}),
        },
      });
      if (res.success && res.data) {
        setAiExplicacion(res.data.explicacion);
      } else {
        setAiError(res.error || 'Sin respuesta');
      }
    } catch (err) {
      setAiError(String(err));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200",
        onSelect && "cursor-pointer hover:border-primary",
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
      <CardContent className="space-y-2">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">{recomendacion.razon}</p>
        </div>
        {aiExplicacion && (
          <div className="rounded border border-utec-blue/30 bg-utec-blue/5 p-2 text-sm">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-utec-blue">
              <Wand2 className="h-3 w-3" /> Explicación IA
            </div>
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{aiExplicacion}</p>
          </div>
        )}
        {aiError && (
          <p className="text-xs text-red-600">Error IA: {aiError}</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExplicar}
          disabled={aiLoading}
          className="h-7 px-2 text-xs text-utec-blue hover:bg-utec-blue/10"
        >
          {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
          <span className="ml-1">{aiExplicacion ? 'Regenerar explicación' : 'Explicar con IA'}</span>
        </Button>
      </CardContent>
    </Card>
  );
}

