import { useState, useEffect } from "react";
import { RecomendacionList } from "./RecomendacionList";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { recomendacionesApi } from "@/lib/api/recomendaciones";
import type { RecomendacionInventario } from "@/lib/types/recomendaciones";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils/helpers";

interface MantenimientoRecomendacionesProps {
  className?: string;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  accentClass: string;
  count: number;
  children: React.ReactNode;
}

function SectionCard({ title, icon, accentClass, count, children }: Readonly<SectionProps>) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
        <span className={`w-1 h-4 rounded-sm shrink-0 ${accentClass}`} />
        {icon}
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {count > 0 && (
          <span className="text-xs text-white/60 ml-auto">{count} recomendaciones</span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
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

  const hasAny = itemsUrgentes.length > 0 || espaciosAtencion.length > 0;

  if (!hasAny) {
    return (
      <SectionCard
        title="Recomendaciones de mantenimiento"
        icon={<Sparkles className="h-4 w-4 text-utec-yellow" />}
        accentClass="bg-utec-yellow"
        count={0}
      >
        <p className="text-sm text-muted-foreground text-center py-2">
          No hay recomendaciones de mantenimiento en este momento.
        </p>
      </SectionCard>
    );
  }

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      {itemsUrgentes.length > 0 && (
        <SectionCard
          title="Items que Requieren Mantenimiento Urgente"
          icon={<Wrench className="h-4 w-4 text-utec-yellow" />}
          accentClass="bg-utec-yellow"
          count={itemsUrgentes.length}
        >
          <RecomendacionList
            recomendaciones={itemsUrgentes}
            loading={loading}
            maxItems={5}
            onSelect={(rec) => {
              if (rec.inventarioItemId) {
                navigate(`/inventory?itemId=${rec.inventarioItemId}`);
              }
            }}
          />
        </SectionCard>
      )}

      {espaciosAtencion.length > 0 && (
        <SectionCard
          title="Espacios que Requieren Atención"
          icon={<AlertTriangle className="h-4 w-4 text-utec-red" />}
          accentClass="bg-utec-red"
          count={espaciosAtencion.length}
        >
          <RecomendacionList
            recomendaciones={espaciosAtencion}
            loading={loading}
            maxItems={5}
            onSelect={(rec) => {
              if (rec.espacioId) {
                navigate(`/rooms/${rec.espacioId}`);
              }
            }}
          />
        </SectionCard>
      )}
    </div>
  );
}
