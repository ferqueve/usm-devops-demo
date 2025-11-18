import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Building2, Users, BarChart3, Loader2 } from 'lucide-react';
import type { DashboardStats as DashboardStatsType } from '@/lib/api/dashboard';

interface DashboardStatsProps {
  stats: DashboardStatsType;
  loading?: boolean;
}

export default function DashboardStats({ stats, loading = false }: DashboardStatsProps) {
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
      label: "Ocupación Promedio",
      value: `${stats.ocupacionPromedio}%`,
      change: `${stats.totalEspacios} espacios totales`,
      trend: stats.ocupacionPromedio > 70 ? "up" as const : "neutral" as const,
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

  if (loading) {
    return (
      <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-4">
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

  return (
    <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
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

