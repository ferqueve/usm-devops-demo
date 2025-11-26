import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecomendacionList } from "./RecomendacionList";
import { Sparkles } from "lucide-react";
import type { RecomendacionBase } from "@/lib/types/recomendaciones";

interface RecomendacionPanelProps<T extends RecomendacionBase> {
  title: string;
  recomendaciones: T[];
  loading?: boolean;
  onSelect?: (recomendacion: T) => void;
  emptyMessage?: string;
  maxItems?: number;
  icon?: React.ReactNode;
}

export function RecomendacionPanel<T extends RecomendacionBase>({
  title,
  recomendaciones,
  loading = false,
  onSelect,
  emptyMessage,
  maxItems = 5,
  icon,
}: RecomendacionPanelProps<T>) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon || <Sparkles className="h-5 w-5 text-primary" />}
          <CardTitle className="text-lg">{title}</CardTitle>
          {recomendaciones.length > 0 && (
            <span className="text-sm text-muted-foreground ml-auto">
              {recomendaciones.length} recomendaciones
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <RecomendacionList
          recomendaciones={recomendaciones}
          loading={loading}
          onSelect={onSelect}
          emptyMessage={emptyMessage}
          maxItems={maxItems}
        />
      </CardContent>
    </Card>
  );
}

