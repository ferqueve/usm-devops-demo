import { Building2, CheckCircle2, Wrench, Users } from 'lucide-react';
import StatsListWidget, {
  type StatsListItem,
} from './_shared/StatsListWidget';

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

export default function SpaceStatsWidget({
  stats,
  loading,
}: Readonly<SpaceStatsWidgetProps>) {
  const items: StatsListItem[] | null = stats
    ? [
        {
          label: 'Total Espacios',
          value: stats.totalEspacios,
          icon: Building2,
          color: 'text-blue-600',
        },
        {
          label: 'Disponibles',
          value: stats.disponibles,
          icon: CheckCircle2,
          color: 'text-green-600',
        },
        {
          label: 'En Mantenimiento',
          value: stats.enMantenimiento,
          icon: Wrench,
          color: 'text-yellow-600',
        },
        {
          label: 'Ocupados',
          value: stats.ocupados,
          icon: Users,
          color: 'text-purple-600',
        },
      ]
    : null;

  return (
    <StatsListWidget
      title="Espacios"
      TitleIcon={Building2}
      items={items}
      loading={loading}
    />
  );
}
