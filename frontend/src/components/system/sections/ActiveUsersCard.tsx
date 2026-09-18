import { memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, User, Clock } from 'lucide-react';
import type { ActiveUsersStats } from '@/lib/types';
import { AvatarInitials } from '@/components/ui/avatar-initials';

interface ActiveUsersCardProps {
  data: ActiveUsersStats | null;
}

const ROLE_BADGE_COLOR: Record<string, string> = {
  ADMIN: 'bg-acento-suave text-acento-texto border-acento-borde',
  ANALISTA: 'bg-info-suave text-info-texto border-info-borde',
  DOCENTE: 'bg-success-suave text-success-texto border-success-borde',
  ESTUDIANTE: 'bg-muted text-foreground border-border',
  EXTERNO: 'bg-warning-suave text-warning-texto border-warning-borde',
  MANTENIMIENTO: 'bg-warning-suave text-warning-texto border-warning-borde',
};

function getRelativeTime(lastActivity: string): string {
  const now = new Date();
  const activityDate = new Date(lastActivity);
  const diffSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
  if (diffSeconds < 60) return `hace ${diffSeconds} segundo${diffSeconds === 1 ? '' : 's'}`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} minuto${diffMinutes === 1 ? '' : 's'}`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
}

function getActivityColor(lastActivity: string): string {
  const diffMinutes = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 60000);
  if (diffMinutes < 1) return 'text-utec-green';
  if (diffMinutes < 3) return 'text-utec-blue';
  if (diffMinutes < 5) return 'text-utec-yellow';
  return 'text-muted-foreground';
}

interface SectionHeaderProps {
  totalActive?: number;
}

function SectionHeader({ totalActive }: Readonly<SectionHeaderProps>) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-chrome text-white">
      <span className="w-1 h-4 rounded-sm shrink-0 bg-utec-green" aria-hidden />
      <Users className="h-3.5 w-3.5 text-white/70 shrink-0" />
      <h3 className="text-sm font-semibold tracking-tight truncate">Usuarios Activos</h3>
      {typeof totalActive === 'number' && (
        <span className="ml-auto text-xs text-white/70 tabular-nums">
          {totalActive} {totalActive === 1 ? 'usuario' : 'usuarios'}
        </span>
      )}
    </div>
  );
}

export const ActiveUsersCard = memo(function ActiveUsersCard({ data }: ActiveUsersCardProps) {
  if (!data) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <SectionHeader />
        <div className="p-4">
          <p className="text-muted-foreground text-center py-4 text-sm">
            Cargando información de usuarios activos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <SectionHeader totalActive={data.totalActiveUsers} />
      <div className="p-4">
        {data.totalActiveUsers === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay usuarios activos en este momento</p>
            <p className="text-xs mt-1">(últimos 5 minutos)</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[170px] pr-2">
            <div className="divide-y">
              {data.activeUsers.map((user, index) => (
                <div
                  key={`${user.email}-${index}`}
                  className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
                >
                  <AvatarInitials
                    name={`${user.nombre} ${user.apellido}`}
                    email={user.email}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {user.nombre} {user.apellido}
                      </p>
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded border ${ROLE_BADGE_COLOR[user.rol] || ROLE_BADGE_COLOR.ESTUDIANTE}`}>
                        {user.rol}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${getActivityColor(user.lastActivity)} shrink-0`}>
                    <Clock className="h-3 w-3" />
                    <span className="font-medium whitespace-nowrap">{getRelativeTime(user.lastActivity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <p className="text-[11px] text-muted-foreground text-center mt-3 pt-2 border-t">
          Actualizado automáticamente cada 2 minutos
        </p>
      </div>
    </div>
  );
});
