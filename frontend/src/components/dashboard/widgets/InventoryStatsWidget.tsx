import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, CheckCircle2, Wrench, AlertTriangle, Archive } from 'lucide-react';
import type { InventoryStats } from '@/lib/types/spaces';

interface InventoryStatsWidgetProps {
  stats: InventoryStats | null;
  loading: boolean;
}

export default function InventoryStatsWidget({ stats, loading }: InventoryStatsWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventario
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
      label: 'Total Items',
      value: stats.totalItems,
      icon: Package,
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
      value: stats.mantenimiento,
      icon: Wrench,
      color: 'text-yellow-600'
    },
    {
      label: 'Dañados',
      value: stats.danados,
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      label: 'Sin Asignar',
      value: stats.sinAsignar,
      icon: Archive,
      color: 'text-gray-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventario
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
