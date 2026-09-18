import { memo } from 'react';
import { CheckCircle2, XCircle, Server, Database, HardDrive, Mail, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HealthComponent, HealthInfo } from '@/lib/types/actuator';

interface ExternalServicesCardProps {
  health: HealthInfo | null | undefined;
}

interface ServiceMeta {
  key: string;
  label: string;
  icon: LucideIcon;
}

// Mapeo de componentes del actuator a metadata visual. Solo se renderiza si
// el componente existe en health.components, así que podemos listar todos.
const SERVICES: ServiceMeta[] = [
  { key: 'aiSvc', label: 'AI Service', icon: Activity },
  { key: 'mlSvc', label: 'ML Service', icon: Activity },
  { key: 'db', label: 'Base de datos', icon: Database },
  { key: 'redis', label: 'Redis', icon: Server },
  { key: 'minio', label: 'MinIO (Storage)', icon: HardDrive },
  { key: 'mail', label: 'SMTP', icon: Mail },
  { key: 'diskSpace', label: 'Disk space', icon: HardDrive },
];

function statusColor(status: string | undefined): { dot: string; text: string } {
  if (status === 'UP') return { dot: 'bg-utec-green', text: 'text-marca-verde-texto' };
  if (status === 'DOWN' || status === 'OUT_OF_SERVICE') return { dot: 'bg-utec-red', text: 'text-marca-rojo-texto' };
  return { dot: 'bg-white/30', text: 'text-white/60' };
}

export const ExternalServicesCard = memo(function ExternalServicesCard({ health }: ExternalServicesCardProps) {
  const components = health?.components ?? {};
  const present = SERVICES
    .map(s => ({ meta: s, comp: components[s.key] as HealthComponent | undefined }))
    .filter(x => x.comp !== undefined);

  if (present.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-chrome overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 text-white">
        <span className="w-1 h-4 rounded-sm shrink-0 bg-utec-green" aria-hidden />
        <Server className="h-3.5 w-3.5 text-white/70 shrink-0" />
        <h3 className="text-sm font-semibold tracking-tight truncate">Servicios y dependencias</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
        {present.map(({ meta, comp }) => {
          const c = statusColor(comp?.status);
          const Icon = meta.icon;
          const isUp = comp?.status === 'UP';
          return (
            <div key={meta.key} className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 min-w-0">
              <Icon className="h-4 w-4 text-white/60 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-white/70 truncate">{meta.label}</div>
                <div className={`text-sm font-semibold ${c.text} flex items-center gap-1`}>
                  {isUp ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {comp?.status ?? 'UNKNOWN'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
