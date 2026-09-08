import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Eye, Edit, CheckCircle, Wrench, XCircle, Building2, CircleDot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { Espacio } from "@/lib/types/spaces";
import PermissionGuard from '@/components/auth/PermissionGuard';
import { cn } from "@/lib/utils/helpers";

interface SpaceCardProps {
  espacio: Espacio;
  onEdit: (espacio: Espacio) => void;
  enCurso?: boolean;
}

function getEstadoLabel(estado: string) {
  switch (estado) {
    case 'MANTENIMIENTO': return 'En mantenimiento';
    case 'NO_DISPONIBLE': return 'No disponible';
    default: return estado;
  }
}

function getEstadoIcon(estado: string) {
  switch (estado) {
    case 'MANTENIMIENTO': return Wrench;
    case 'NO_DISPONIBLE': return XCircle;
    default: return CheckCircle;
  }
}

export function SpaceCard({ espacio, onEdit, enCurso = false }: Readonly<SpaceCardProps>) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleViewDetails = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/rooms/${espacio.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(espacio);
  };

  const hasImagen = Boolean(espacio.imagenUrl) && !imageError;
  const tipoColor = espacio.tipoEspacioColor;
  const fueraDeServicio = espacio.estado !== 'DISPONIBLE';
  const EstadoFueraIcon = getEstadoIcon(espacio.estado);

  // Disponibilidad en este momento (solo aplica si el espacio está DISPONIBLE)
  const ocupadoBadge = enCurso
    ? { label: 'Ocupado', className: 'bg-utec-orange text-white' }
    : { label: 'Libre', className: 'bg-utec-green text-white' };

  const cardBody = (
    <Card
      className={cn(
        "group hover:shadow-lg shadow-sm transition-all duration-200 cursor-pointer h-full flex flex-col border-0 border-t-4 border-t-utec-dark overflow-hidden gap-0 py-0",
        fueraDeServicio && "opacity-60 grayscale hover:opacity-80",
      )}
      onClick={handleViewDetails}
    >
      {/* Banner superior uniforme */}
      <div className="relative aspect-[16/10] overflow-hidden bg-utec-dark">
        {hasImagen ? (
          <img
            // La tarjeta muestra 279 px: la original son 4096 y casi 2 MB.
            src={espacio.imagenThumbUrl ?? espacio.imagenUrl}
            alt={espacio.nombre}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-utec-dark">
            <Building2 className="h-10 w-10 text-white/40" />
            <span className="text-xs uppercase tracking-wider text-white/70 font-medium">
              {espacio.tipoEspacioNombre || 'Sin tipo'}
            </span>
          </div>
        )}

        {/* Badge en overlay: estado fuera de servicio, o disponibilidad ahora */}
        {fueraDeServicio ? (
          <Badge className="bg-gray-700 text-white font-medium text-xs absolute top-2 right-2 shadow-sm border-0">
            <EstadoFueraIcon className="h-3 w-3 mr-1" />
            {getEstadoLabel(espacio.estado)}
          </Badge>
        ) : (
          <Badge className={`${ocupadoBadge.className} font-medium text-xs absolute top-2 right-2 shadow-sm border-0`}>
            <CircleDot className="h-3 w-3 mr-1" />
            {ocupadoBadge.label}
          </Badge>
        )}
      </div>

      <CardContent className="px-3 py-2.5 flex-1 flex flex-col">
        {/* Header: título + chip de tipo */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <CardTitle className="text-sm font-semibold line-clamp-1 leading-tight flex-1 min-w-0">
            {espacio.nombre}
          </CardTitle>
          {tipoColor ? (
            <span
              className="px-2 py-0.5 rounded text-white text-xs font-medium flex-shrink-0"
              style={{ backgroundColor: tipoColor }}
            >
              {espacio.tipoEspacioNombre}
            </span>
          ) : (
            <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-1 flex-shrink-0">
              {espacio.tipoEspacioNombre || 'Sin tipo'}
            </Badge>
          )}
        </div>

        {/* Edificio + capacidad alineada a la derecha */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {espacio.edificioNombre && (
              <>
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{espacio.edificioNombre}</span>
              </>
            )}
          </div>
          <span className="flex items-center gap-1 shrink-0">
            <Users className="h-3.5 w-3.5" />
            <span className="tabular-nums">{espacio.capacidad}</span>
          </span>
        </div>

        {/* Botones de acción side-by-side */}
        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-sm hover:bg-utec-dark hover:text-white hover:border-utec-dark transition-colors"
            onClick={handleViewDetails}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Ver
          </Button>
          <PermissionGuard requiredPermission="espacio:editar">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-sm hover:bg-utec-dark hover:text-white hover:border-utec-dark transition-colors"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Editar
            </Button>
          </PermissionGuard>
        </div>
      </CardContent>
    </Card>
  );

  if (fueraDeServicio) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{cardBody}</div>
        </TooltipTrigger>
        <TooltipContent>{getEstadoLabel(espacio.estado)}</TooltipContent>
      </Tooltip>
    );
  }

  return cardBody;
}
