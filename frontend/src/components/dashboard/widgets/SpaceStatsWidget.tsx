import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle2, Wrench, Users } from 'lucide-react';

interface EspaciosStats {
  totalEspacios: number;
  disponibles: number;
  enMantenimiento: number;
  ocupados: number;
}

interface SpaceStatsWidgetProps {
  stats: EspaciosStats | null;
  loading: boolean;
}

export default function SpaceStatsWidget({ stats, loading }: SpaceStatsWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Espacios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const items = [
    {
      label: 'Total Espacios',
      value: stats.totalEspacios,
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      label: 'Disponibles',
      value: stats.disponibles,
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      label: 'En Mantenimiento',
      value: stats.enMantenimiento,
      icon: Wrench,
      color: 'text-yellow-600'
    },
    {
      label: 'Ocupados',
      value: stats.ocupados,
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Espacios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="text-lg font-semibold">{item.value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
