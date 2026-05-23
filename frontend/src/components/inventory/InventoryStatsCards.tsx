import { Package, AlertCircle, CheckCircle, Wrench, MapPinOff, BadgeCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface InventoryStatsCardsProps {
  statistics: {
    totalItems: number;
    disponibles: number;
    mantenimiento: number;
    danados: number;
    sinAsignar: number;
  } | null;
}

interface Cell {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: string;
}

export default function InventoryStatsCards({ statistics }: Readonly<InventoryStatsCardsProps>) {
  const totalItems = statistics?.totalItems || 0;
  const disponibles = statistics?.disponibles || 0;
  const mantenimiento = statistics?.mantenimiento || 0;
  const danados = statistics?.danados || 0;
  const sinAsignar = statistics?.sinAsignar || 0;

  const pct = (n: number) => (totalItems > 0 ? `${Math.round((n / totalItems) * 100)}%` : '0%');

  const cells: Cell[] = [
    { label: 'Total de items', value: totalItems, hint: 'Inventariados', icon: Package },
    { label: 'Disponibles', value: disponibles, hint: pct(disponibles), icon: CheckCircle, accent: 'text-utec-green' },
    { label: 'Mantenimiento', value: mantenimiento, hint: pct(mantenimiento), icon: Wrench, accent: 'text-utec-yellow' },
    { label: 'Dañados', value: danados, hint: pct(danados), icon: AlertCircle, accent: 'text-utec-red' },
    { label: 'Sin asignar', value: sinAsignar, hint: sinAsignar > 0 ? 'Requieren asignación' : 'Todos asignados', icon: MapPinOff },
    { label: 'Asignados', value: totalItems - sinAsignar, hint: pct(totalItems - sinAsignar), icon: BadgeCheck, accent: 'text-utec-blue' },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 text-sm">
      {cells.map(({ label, value, hint, icon: Icon, accent }) => (
        <div key={label} className="rounded-lg bg-utec-dark text-white px-3 py-2 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-white/60 mb-0.5">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
          <div className={`text-lg font-semibold tabular-nums ${accent ?? ''}`}>{value}</div>
          {hint && <div className="text-[11px] text-white/60 truncate">{hint}</div>}
        </div>
      ))}
    </div>
  );
}
