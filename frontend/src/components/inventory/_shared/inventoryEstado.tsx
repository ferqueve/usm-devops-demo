import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Wrench, AlertCircle } from "lucide-react";

interface EstadoConfig {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ESTADO_CONFIGS: Record<string, EstadoConfig> = {
  DISPONIBLE: {
    label: 'Disponible',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  MANTENIMIENTO: {
    label: 'Mantenimiento',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Wrench,
  },
  DANADO: {
    label: 'Dañado',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertCircle,
  },
};

const FALLBACK_CONFIG: EstadoConfig = {
  label: '',
  color: 'bg-gray-50 text-gray-700 border-gray-200',
  icon: AlertCircle,
};

export function EstadoBadge({ estado }: Readonly<{ estado: string }>) {
  const base = ESTADO_CONFIGS[estado];
  const config = base ?? { ...FALLBACK_CONFIG, label: estado };
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} border font-medium`}>
      <Icon className="h-3.5 w-3.5 mr-1.5" />
      {config.label}
    </Badge>
  );
}
