import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Calendar, BookOpen, Building2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PermissionGuard from '@/components/auth/PermissionGuard';
import type { Permission } from '@/lib/config/permissions';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Nueva Reserva",
      icon: BookOpen,
      onClick: () => navigate('/reservations'),
      variant: "default" as const,
      description: "Crear una nueva reserva de espacio"
    },
    {
      label: "Ver Calendario",
      icon: Calendar,
      onClick: () => navigate('/calendar'),
      variant: "outline" as const,
      description: "Ver todas las reservas en calendario"
    },
    {
      label: "Gestionar Espacios",
      icon: Building2,
      onClick: () => navigate('/rooms'),
      variant: "outline" as const,
      description: "Ver y gestionar espacios disponibles"
    },
    {
      label: "Ver Estadísticas",
      icon: BarChart3,
      onClick: () => navigate('/statistics'),
      variant: "outline" as const,
      description: "Ver estadísticas detalladas del sistema"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            // Determinar permisos según la acción
            let requiredPermissions: Permission[] | undefined;
            if (action.label === "Nueva Reserva") {
              requiredPermissions = ['reservas:crear', 'reservas:solicitar'] as Permission[];
            } else if (action.label === "Gestionar Espacios") {
              requiredPermissions = ['espacios:leer'] as Permission[];
            } else if (action.label === "Ver Estadísticas") {
              requiredPermissions = ['estadisticas:ver'] as Permission[];
            }
            
            const button = (
              <Button
                key={action.label}
                variant={action.variant}
                className="h-auto flex-col items-center justify-center p-6 space-y-2 hover:shadow-md transition-all"
                onClick={action.onClick}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
            
            return requiredPermissions ? (
              <PermissionGuard key={action.label} requiredPermissions={requiredPermissions}>
                {button}
              </PermissionGuard>
            ) : (
              button
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

