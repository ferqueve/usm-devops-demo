import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Users, Eye, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Espacio } from "@/lib/types/spaces";

interface SpaceCardProps {
  espacio: Espacio;
  canEdit: boolean;
  onEdit: (espacio: Espacio) => void;
}

// Función para obtener configuración del tipo de espacio
function getTipoEspacioConfig(tipoNombre: string | null | undefined) {
  if (!tipoNombre) {
    return { label: 'Sin tipo', color: 'bg-gray-100 text-gray-800' };
  }
  
  const tipoLower = tipoNombre.toLowerCase();
  
  if (tipoLower.includes('aula')) {
    return { label: 'Aula', color: 'bg-blue-100 text-blue-800' };
  } else if (tipoLower.includes('laboratorio')) {
    return { label: 'Laboratorio', color: 'bg-green-100 text-green-800' };
  } else if (tipoLower.includes('auditorio')) {
    return { label: 'Auditorio', color: 'bg-purple-100 text-purple-800' };
  } else if (tipoLower.includes('reunion')) {
    return { label: 'Sala de Reuniones', color: 'bg-orange-100 text-orange-800' };
  } else if (tipoLower.includes('oficina')) {
    return { label: 'Oficina', color: 'bg-gray-100 text-gray-800' };
  } else if (tipoLower.includes('biblioteca')) {
    return { label: 'Biblioteca', color: 'bg-indigo-100 text-indigo-800' };
  } else if (tipoLower.includes('taller')) {
    return { label: 'Taller', color: 'bg-yellow-100 text-yellow-800' };
  } else if (tipoLower.includes('gimnasio')) {
    return { label: 'Gimnasio', color: 'bg-red-100 text-red-800' };
  } else {
    return { label: tipoNombre, color: 'bg-gray-100 text-gray-800' };
  }
}

export function SpaceCard({ espacio, canEdit, onEdit }: SpaceCardProps) {
  const navigate = useNavigate();
  const tipoConfig = getTipoEspacioConfig(espacio.tipoEspacioNombre);

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
      className="group hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col border border-gray-200 hover:border-gray-300 overflow-hidden"
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
          <Badge className={`${tipoConfig.color} text-xs px-2 py-1 flex-shrink-0`}>
            {tipoConfig.label}
          </Badge>
        </div>

        {/* Capacidad */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-600 font-medium">{espacio.capacidad} personas</span>
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
