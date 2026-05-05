
import { RecomendacionCard } from "./RecomendacionCard";
import { Loader2 } from "lucide-react";
import type { RecomendacionBase } from "@/lib/types/recomendaciones";

interface RecomendacionListProps<T extends RecomendacionBase> {
  recomendaciones: T[];
  loading?: boolean;
  onSelect?: (recomendacion: T) => void;
  emptyMessage?: string;
  maxItems?: number;
}

export function RecomendacionList<T extends RecomendacionBase>({
  recomendaciones,
  loading = false,
  onSelect,
  emptyMessage = "No hay recomendaciones disponibles",
  maxItems,
}: Readonly<RecomendacionListProps<T>>) {
  const displayedItems = maxItems 
    ? recomendaciones.slice(0, maxItems)
    : recomendaciones;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recomendaciones.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedItems.map((recomendacion, index) => (
        <RecomendacionCard
          key={recomendacion.id || index}
          recomendacion={recomendacion}
          onSelect={onSelect ? () => onSelect(recomendacion) : undefined}
        />
      ))}
    </div>
  );
}

