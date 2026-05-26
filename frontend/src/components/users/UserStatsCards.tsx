import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { usuariosApi } from '@/lib/api/users';
import { ROLE_LABELS, ROLES } from '@/lib/config/constants';
import type { UserRole, UserStats } from '@/lib/types/users';
import { Users, UserCheck, MailX, Shield, Monitor, Chrome } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

type UtecBg = 'blue' | 'yellow' | 'green' | 'orange' | 'red' | 'cyan' | 'dark';

const bgClasses: Record<UtecBg, { bg: string; text: string; subtle: string }> = {
  blue:   { bg: 'bg-utec-blue',   text: 'text-white',     subtle: 'text-white/70' },
  yellow: { bg: 'bg-utec-yellow', text: 'text-utec-dark', subtle: 'text-utec-dark/70' },
  green:  { bg: 'bg-utec-green',  text: 'text-white',     subtle: 'text-white/80' },
  orange: { bg: 'bg-utec-orange', text: 'text-white',     subtle: 'text-white/80' },
  red:    { bg: 'bg-utec-red',    text: 'text-white',     subtle: 'text-white/80' },
  cyan:   { bg: 'bg-utec-cyan',   text: 'text-utec-dark', subtle: 'text-utec-dark/70' },
  dark:   { bg: 'bg-utec-dark',   text: 'text-white',     subtle: 'text-white/60' },
};

interface ColoredStatProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  bg: UtecBg;
}

function ColoredStat({ label, value, hint, icon: Icon, bg }: Readonly<ColoredStatProps>) {
  const c = bgClasses[bg];
  return (
    <div className={`rounded-xl p-4 min-w-0 ${c.bg}`}>
      <div className={`flex items-center gap-1.5 text-xs mb-1 ${c.subtle}`}>
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${c.text}`}>{value}</div>
      {hint && <div className={`text-[11px] mt-0.5 truncate ${c.subtle}`}>{hint}</div>}
    </div>
  );
}

const ROLE_COLOR: Record<UserRole, string> = {
  [ROLES.ADMIN]: '#DF2B31',
  [ROLES.ANALISTA]: '#184897',
  [ROLES.DOCENTE]: '#00c7ff',
  [ROLES.ESTUDIANTE]: '#86bb4c',
  [ROLES.EXTERNO]: '#F6CA21',
  [ROLES.MANTENIMIENTO]: '#DE7A27',
};

interface TooltipPayload {
  name?: string;
  value?: number;
  color?: string;
  payload?: { color?: string; fill?: string };
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload?.length) {
    return (
      <div className="bg-utec-dark text-white border border-utec-dark/40 rounded-md shadow-lg px-2.5 py-1.5 text-xs">
        {payload.map((entry, index) => {
          const p = entry as TooltipPayload;
          const color = p.color ?? p.payload?.fill;
          return (
            <p key={`${p.name ?? 'entry'}-${index}`} className="tabular-nums">
              <span style={{ color }}>●</span>{' '}
              <span className="text-white/70">{p.name}:</span>{' '}
              <span className="font-semibold">{p.value}</span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
}

interface RolesDonutProps {
  stats: UserStats;
}

function RolesDonut({ stats }: Readonly<RolesDonutProps>) {
  const rolesData = (Object.entries(stats.usuariosPorRol) as Array<[UserRole, number]>)
    .filter(([, count]) => count > 0)
    .map(([rol, count]) => ({
      name: ROLE_LABELS[rol],
      value: count,
      color: ROLE_COLOR[rol],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-xl border bg-card overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
        <span className="w-1 h-4 rounded-sm shrink-0 bg-utec-green" aria-hidden />
        <Shield className="h-3.5 w-3.5 text-white/70 shrink-0" />
        <h3 className="text-sm font-semibold tracking-tight truncate">Distribución por rol</h3>
      </div>
      <div className="p-3 flex-1 flex items-center gap-3">
        <div className="w-[55%] shrink-0">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={rolesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={42}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {rolesData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 flex flex-col gap-1.5 text-xs min-w-0">
          {rolesData.map((d) => {
            const pct = stats.totalUsuarios === 0 ? 0 : Math.round((d.value / stats.totalUsuarios) * 100);
            return (
              <li key={d.name} className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
                <span className="text-muted-foreground truncate flex-1">{d.name}</span>
                <span className="font-semibold tabular-nums shrink-0">{d.value}</span>
                <span className="text-muted-foreground tabular-nums shrink-0 w-9 text-right">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function UserStatsCards() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await usuariosApi.obtenerEstadisticas();
      setStats(response || null);
    } catch (error: unknown) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas', {
        description: error instanceof Error ? error.message : 'No se pudieron cargar las estadísticas'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl bg-muted p-4 animate-pulse">
            <div className="h-3 w-16 bg-foreground/10 rounded mb-2" />
            <div className="h-6 w-12 bg-foreground/20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-xl bg-muted p-4 text-center text-muted-foreground">
        Error al cargar estadísticas
      </div>
    );
  }

  const porcentajeVerificados = stats.totalUsuarios > 0
    ? Math.round((stats.totalVerificados / stats.totalUsuarios) * 100)
    : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Izquierda: 6 stat cards de colores en grid 2x3 / 3x2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ColoredStat label="Total usuarios" value={stats.totalUsuarios} hint={`${stats.totalActivos} activos · ${stats.totalInactivos} inactivos`} icon={Users} bg="dark" />
        <ColoredStat label="Verificados" value={stats.totalVerificados} hint={`${porcentajeVerificados}% del total`} icon={UserCheck} bg="dark" />
        <ColoredStat label="Sin verificar" value={stats.totalNoVerificados} hint={`${100 - porcentajeVerificados}% del total`} icon={MailX} bg="dark" />
        <ColoredStat label="Activos" value={stats.totalActivos} hint={`${stats.totalInactivos} inactivos`} icon={Shield} bg="dark" />
        <ColoredStat label="Local" value={stats.usuariosPorProveedor.LOCAL || 0} hint="auth interna" icon={Monitor} bg="dark" />
        <ColoredStat label="Google" value={stats.usuariosPorProveedor.GOOGLE || 0} hint="OAuth Google" icon={Chrome} bg="dark" />
      </div>

      {/* Derecha: donut de distribución por rol */}
      <RolesDonut stats={stats} />
    </div>
  );
}
