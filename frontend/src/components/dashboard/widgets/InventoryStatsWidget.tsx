import {
  Package,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import type { InventoryStats } from '@/lib/types/spaces';
import StatsListWidget, {
  type StatsListItem,
} from './_shared/StatsListWidget';

interface InventoryStatsWidgetProps {
  stats: InventoryStats | null;
  loading: boolean;
}

export default function InventoryStatsWidget({
  stats,
  loading,
}: Readonly<InventoryStatsWidgetProps>) {
  const items: StatsListItem[] | null = stats
    ? [
        {
          label: 'Total Items',
          value: stats.totalItems,
          icon: Package,
          color: 'text-info-texto',
        },
        {
          label: 'Disponibles',
          value: stats.disponibles,
          icon: CheckCircle2,
          color: 'text-success-texto',
        },
        {
          label: 'En Mantenimiento',
          value: stats.mantenimiento,
          icon: Wrench,
          color: 'text-warning-texto',
        },
        {
          label: 'Dañados',
          value: stats.danados,
          icon: AlertTriangle,
          color: 'text-danger-texto',
        },
        {
          label: 'Sin Asignar',
          value: stats.sinAsignar,
          icon: Archive,
          color: 'text-muted-foreground',
        },
      ]
    : null;

  return (
    <StatsListWidget
      title="Inventario"
      TitleIcon={Package}
      items={items}
      loading={loading}
    />
  );
}
