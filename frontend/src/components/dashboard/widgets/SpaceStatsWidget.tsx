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
          value: stats.enMantenimiento,
          icon: Wrench,
          color: 'text-warning-texto',
        },
        {
          label: 'Ocupados',
          value: stats.ocupados,
          icon: Users,
          color: 'text-acento-texto',
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
