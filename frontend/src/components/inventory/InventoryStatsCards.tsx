import { StatStrip, type StatItem } from '@/components/common/StatStrip';
import { Package, AlertCircle, CheckCircle, Wrench, MapPinOff, BadgeCheck } from "lucide-react";

interface InventoryStatsCardsProps {
  statistics: {
    totalItems: number;
    disponibles: number;
    mantenimiento: number;
    danados: number;
    sinAsignar: number;
  } | null;
}

export default function InventoryStatsCards({ statistics }: Readonly<InventoryStatsCardsProps>) {
  const totalItems = statistics?.totalItems || 0;
  const disponibles = statistics?.disponibles || 0;
  const mantenimiento = statistics?.mantenimiento || 0;
  const danados = statistics?.danados || 0;
  const sinAsignar = statistics?.sinAsignar || 0;

  const pct = (n: number) => (totalItems > 0 ? `${Math.round((n / totalItems) * 100)}%` : '0%');

  const celdas: StatItem[] = [
    { label: 'Total de items', value: totalItems, hint: 'Inventariados', icon: Package, color: 'oscuro' },
    { label: 'Disponibles', value: disponibles, hint: pct(disponibles), icon: CheckCircle, color: 'verde' },
    { label: 'Mantenimiento', value: mantenimiento, hint: pct(mantenimiento), icon: Wrench, color: 'amarillo' },
    { label: 'Dañados', value: danados, hint: pct(danados), icon: AlertCircle, color: 'rojo' },
    { label: 'Sin asignar', value: sinAsignar, hint: sinAsignar > 0 ? 'Requieren asignación' : 'Todos asignados', icon: MapPinOff, color: 'oscuro' },
    { label: 'Asignados', value: totalItems - sinAsignar, hint: pct(totalItems - sinAsignar), icon: BadgeCheck, color: 'azul' },
  ];

  return <StatStrip items={celdas} />;
}
