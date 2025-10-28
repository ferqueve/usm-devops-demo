import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Users, Eye, Edit, CheckCircle, Wrench, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Espacio } from "@/lib/types/spaces";

// Función para obtener configuración del estado
function getEstadoConfig(estado: string) {
  switch (estado) {
    case 'DISPONIBLE':
      return { 
        label: 'Disponible', 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle
      };
    case 'MANTENIMIENTO':
      return { 
        label: 'En Mantenimiento', 
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Wrench
      };
    case 'NO_DISPONIBLE':
      return { 
        label: 'No Disponible', 
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle
      };
    default:
      return { 
        label: estado, 
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: CheckCircle
      };
  }
}

interface SpaceCardProps {
  espacio: Espacio;
  canEdit: boolean;
  onEdit: (espacio: Espacio) => void;
}

export function SpaceCard({ espacio, canEdit, onEdit }: SpaceCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/rooms/${espacio.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(espacio);
  };

  return (
    <Card 
      className="group hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col border border-gray-200 hover:border-gray-300 overflow-hidden relative"
      style={{ 
        borderTop: espacio.tipoEspacioColor ? `6px solid ${espacio.tipoEspacioColor}` : undefined 
      }}
      onClick={handleViewDetails}
    >
      {/* Imagen del espacio - más compacta */}
      {espacio.imagenUrl ? (
        <div className="aspect-[16/10] overflow-hidden bg-gray-100 group-hover:scale-[1.02] transition-transform duration-200">
          <img 
            src={espacio.imagenUrl} 
            alt={espacio.nombre}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-200">
          <Users className="h-6 w-6 text-gray-400" />
        </div>
      )}

      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Header con título y badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <CardTitle className="text-sm font-semibold line-clamp-1 leading-tight flex-1 min-w-0">
            {espacio.nombre}
          </CardTitle>
          {espacio.tipoEspacioColor ? (
            <span 
              className="px-2 py-0.5 rounded text-white text-xs font-medium flex-shrink-0"
              style={{ backgroundColor: espacio.tipoEspacioColor }}
            >
              {espacio.tipoEspacioNombre}
            </span>
          ) : (
            <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-1 flex-shrink-0">
              {espacio.tipoEspacioNombre || 'Sin tipo'}
            </Badge>
          )}
        </div>

        {/* Capacidad y Estado */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-600 font-medium">{espacio.capacidad} personas</span>
          </div>
          <div>
            {(() => {
              const estadoConfig = getEstadoConfig(espacio.estado);
              const EstadoIcon = estadoConfig.icon;
              return (
                <Badge className={`${estadoConfig.color} border font-medium text-xs`}>
                  <EstadoIcon className="h-3 w-3 mr-1" />
                  {estadoConfig.label}
                </Badge>
              );
            })()}
          </div>
        </div>

        {/* Botones de acción */}
        <div className={`flex gap-2 mt-auto ${canEdit ? 'flex-col' : ''}`}>
          <Button 
            size="sm" 
            variant="outline" 
            className={`${canEdit ? 'w-full' : 'w-full'} h-8 text-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors duration-200`}
            onClick={handleViewDetails}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Ver Detalles
          </Button>
          {canEdit && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full h-8 text-sm hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors duration-200"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
