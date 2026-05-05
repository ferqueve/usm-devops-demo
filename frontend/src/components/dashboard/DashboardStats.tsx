import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Building2, Users, BarChart3, Calendar, Clock } from 'lucide-react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import type { DashboardStats as DashboardStatsType } from '@/lib/api/dashboard';

interface DashboardStatsProps {
  stats: DashboardStatsType;
  loading?: boolean;
}

export default function DashboardStats({ stats, loading = false }: Readonly<DashboardStatsProps>) {
  const { hasPermission } = useRolePermissions();

  // Permission-based logic
  const canManageUsers = hasPermission('usuario:gestionar'); // ADMIN can manage users
  const canViewRecommendations = hasPermission('recomendacion:ver'); // DOCENTE has this, EXTERNO doesn't
  
  // Estadísticas para usuarios externos (solo reservas públicas)
  const statCardsExterno = [
    {
      label: "Reservas Públicas",
      value: stats.totalReservas,
      change: `${stats.reservasHoy} eventos hoy`,
      trend: "up" as const,
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      label: "Eventos Aprobados",
      value: stats.reservasAprobadas,
      change: `${stats.reservasHoy} eventos públicos hoy`,
      trend: "up" as const,
      icon: BookOpen,
      color: "text-green-600"
    },
    {
      label: "Mis Solicitudes Pendientes",
      value: stats.reservasPendientes,
      change: "Esperando aprobación",
      trend: stats.reservasPendientes > 0 ? "neutral" as const : "up" as const,
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      label: "Espacios Disponibles",
      value: stats.espaciosDisponibles,
      change: `${stats.totalEspacios} espacios totales`,
      trend: "up" as const,
      icon: Building2,
      color: "text-purple-600"
    }
  ];

  // Estadísticas para otros roles
  const statCards = [
    {
      label: "Reservas Activas",
      value: stats.reservasAprobadas,
      change: `${stats.reservasHoy} hoy`,
      trend: "up" as const,
      icon: BookOpen,
      color: "text-blue-600"
    },
    {
      label: "Espacios Disponibles",
      value: stats.espaciosDisponibles,
      change: `${stats.espaciosEnMantenimiento} en mantenimiento`,
      trend: stats.espaciosEnMantenimiento > 0 ? "neutral" as const : "up" as const,
      icon: Building2,
      color: "text-green-600"
    },
    {
      label: "Reservas por Espacio",
      value: stats.promedioReservasPorEspacio.toFixed(1),
      change: `${stats.totalEspacios} espacios totales`,
      trend: stats.promedioReservasPorEspacio > 5 ? "up" as const : "neutral" as const,
      icon: BarChart3,
      color: "text-purple-600"
    },
    {
      label: "Usuarios Activos",
      value: stats.usuariosActivos,
      change: stats.usuariosNuevosHoy > 0 ? `+${stats.usuariosNuevosHoy} nuevos hoy` : "Sin cambios",
      trend: stats.usuariosNuevosHoy > 0 ? "up" as const : "neutral" as const,
      icon: Users,
      color: "text-indigo-600"
    }
  ];

  // Usar estadísticas específicas para usuarios sin permiso recomendacion:ver (EXTERNO)
  const cardsToUse = canViewRecommendations ? statCards : statCardsExterno;

  if (loading) {
    const cardCount = 4; // Siempre son 4 cards
    return (
      <div className={`grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-${cardCount}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filtrar cards: solo usuarios con permiso usuario:gestionar pueden ver "Usuarios Activos"
  const visibleCards = cardsToUse.filter(stat => {
    if (stat.label === "Usuarios Activos") {
      return canManageUsers;
    }
    return true;
  });

  // Ajustar el grid dinámicamente según la cantidad de cards visibles
  const cardCount = visibleCards.length;
  const getGridCols = (count: number): string => {
    if (count === 3) return 'md:grid-cols-2 lg:grid-cols-3';
    if (count === 2) return 'md:grid-cols-2';
    return 'md:grid-cols-2 lg:grid-cols-4';
  };
  const gridCols = getGridCols(cardCount);

  return (
    <div className={`grid gap-4 lg:gap-6 ${gridCols}`}>
      {visibleCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

