import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { mockRooms } from "@/data/mock-data";
import type { Room } from "@/lib/types";

// Componente para mostrar el tipo de espacio
function RoomTypeBadge({ type }: Readonly<{ type: Room['type'] }>) {
  const getTypeConfig = (type: Room['type']) => {
    switch (type) {
      case 'classroom':
        return { label: 'Aula', color: 'bg-blue-100 text-blue-800' };
      case 'laboratory':
        return { label: 'Laboratorio', color: 'bg-green-100 text-green-800' };
      case 'auditorium':
        return { label: 'Auditorio', color: 'bg-purple-100 text-purple-800' };
      case 'meeting-room':
        return { label: 'Sala de Reuniones', color: 'bg-orange-100 text-orange-800' };
      default:
        return { label: 'Otro', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const config = getTypeConfig(type);

  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  );
}

// Componente para mostrar el estado de disponibilidad
function AvailabilityStatus({ isAvailable }: Readonly<{ isAvailable: boolean }>) {
  return (
    <div className={`flex items-center gap-2 ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
      <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm font-medium">
        {isAvailable ? 'Disponible' : 'No Disponible'}
      </span>
    </div>
  );
}

// Vista de Gestión de Espacios
export default function Rooms() {
  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-end">
        <Button>
          <span className="mr-2">+</span>
          {'Agregar Espacio'}
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button variant="outline" size="sm">Todos</Button>
            <Button variant="outline" size="sm">Aulas</Button>
            <Button variant="outline" size="sm">Laboratorios</Button>
            <Button variant="outline" size="sm">Auditorios</Button>
            <Button variant="outline" size="sm">Salas de Reuniones</Button>
            <Button variant="outline" size="sm">Disponibles</Button>
            <Button variant="outline" size="sm">En Mantenimiento</Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de espacios */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockRooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{room.name}</CardTitle>
                <RoomTypeBadge type={room.type} />
              </div>
              <p className="text-sm text-muted-foreground">
                {room.building} - Piso {room.floor}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Estado de disponibilidad */}
              <AvailabilityStatus isAvailable={room.isAvailable ?? true} />
              
              {/* Capacidad */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Capacidad:</span>
                <span className="text-sm">{room.capacity} personas</span>
              </div>

              {/* Equipamiento */}
              <div>
                <span className="text-sm font-medium">Equipamiento:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {room.equipment.slice(0, 3).map((item) => (
                    <Badge key={item} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                  {room.equipment.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{room.equipment.length - 3} más
                    </Badge>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Ver Detalles
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estadísticas de espacios */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Espacios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <p className="text-sm text-muted-foreground">Total Espacios</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">8</div>
              <p className="text-sm text-muted-foreground">Disponibles</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">2</div>
              <p className="text-sm text-muted-foreground">En Mantenimiento</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">2</div>
              <p className="text-sm text-muted-foreground">Ocupados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

