import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, User, Clock } from 'lucide-react';
import type { ActiveUsersStats } from '@/core/types/types';
import { AvatarInitials } from '@/components/ui/avatar-initials';

interface ActiveUsersCardProps {
  data: ActiveUsersStats | null;
}

export const ActiveUsersCard = memo(function ActiveUsersCard({ data }: ActiveUsersCardProps) {
  
  // Función para obtener el tiempo relativo desde la última actividad
  const getRelativeTime = (lastActivity: string): string => {
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) {
      return `hace ${diffSeconds} segundo${diffSeconds !== 1 ? 's' : ''}`;
    } else if (diffMinutes < 60) {
      return `hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    }
  };

  // Función para obtener el color según qué tan reciente fue la actividad
  const getActivityColor = (lastActivity: string): string => {
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffMinutes = Math.floor((now.getTime() - activityDate.getTime()) / 60000);

    if (diffMinutes < 1) return 'text-green-600';
    if (diffMinutes < 3) return 'text-blue-600';
    if (diffMinutes < 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  // Función para obtener el color del badge por rol
  const getRoleBadgeColor = (rol: string): string => {
    const colors: Record<string, string> = {
      'ADMIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'ANALISTA': 'bg-blue-100 text-blue-800 border-blue-200',
      'DOCENTE': 'bg-green-100 text-green-800 border-green-200',
      'ESTUDIANTE': 'bg-gray-100 text-gray-800 border-gray-200',
      'EXTERNO': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[rol] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (!data) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-utec-green" />
            Usuarios Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Cargando información de usuarios activos...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-utec-green" />
          Usuarios Activos
          <Badge variant="secondary" className="ml-auto">
            {data.totalActiveUsers} {data.totalActiveUsers === 1 ? 'usuario' : 'usuarios'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.totalActiveUsers === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay usuarios activos en este momento</p>
            <p className="text-xs mt-1">(últimos 5 minutos)</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {data.activeUsers.map((user, index) => (
                <div
                  key={`${user.email}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors duration-150"
                >
                  {/* Avatar con iniciales */}
                  <AvatarInitials
                    name={`${user.nombre} ${user.apellido}`}
                    email={user.email}
                    size="md"
                    className="flex-shrink-0"
                  />

                  {/* Información del usuario */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">
                        {user.nombre} {user.apellido}
                      </p>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md border ${getRoleBadgeColor(user.rol)}`}>
                        {user.rol}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {user.email}
                    </p>
                    <div className={`flex items-center gap-1 text-xs ${getActivityColor(user.lastActivity)}`}>
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">
                        {getRelativeTime(user.lastActivity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Actualizado automáticamente cada 2 minutos
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

