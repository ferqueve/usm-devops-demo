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
    color: 'bg-utec-green text-marca-tinta border-utec-green',
    icon: CheckCircle,
  },
  MANTENIMIENTO: {
    label: 'Mantenimiento',
    color: 'bg-utec-yellow text-marca-tinta border-utec-yellow',
    icon: Wrench,
  },
  DANADO: {
    label: 'Dañado',
    color: 'bg-utec-red text-white border-utec-red',
    icon: AlertCircle,
  },
};

const FALLBACK_CONFIG: EstadoConfig = {
  label: '',
  color: 'bg-muted text-foreground/80 border-border',
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
