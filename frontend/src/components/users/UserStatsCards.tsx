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
import { toast } from 'sonner';
import { MARCA } from '@/lib/design/paleta';
import { StatStrip } from '@/components/common/StatStrip';

const ROLE_COLOR: Record<UserRole, string> = {
  [ROLES.ADMIN]: MARCA.rojo,
  [ROLES.ANALISTA]: MARCA.azul,
  [ROLES.DOCENTE]: MARCA.cian,
  [ROLES.ESTUDIANTE]: MARCA.verde,
  [ROLES.EXTERNO]: MARCA.amarillo,
  [ROLES.MANTENIMIENTO]: MARCA.naranja,
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
      <div className="bg-chrome text-white border border-utec-dark/40 rounded-md shadow-lg px-2.5 py-1.5 text-xs">
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
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-chrome text-white">
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
      {/* Izquierda: las seis celdas, en 2x3 / 3x2 porque es media pantalla. */}
      <div>
        <StatStrip
          maxColumnas={3}
          items={[
            { label: 'Total usuarios', value: stats.totalUsuarios, hint: `${stats.totalActivos} activos · ${stats.totalInactivos} inactivos`, icon: Users, color: 'oscuro' },
            { label: 'Verificados', value: stats.totalVerificados, hint: `${porcentajeVerificados}% del total`, icon: UserCheck, color: 'oscuro' },
            { label: 'Sin verificar', value: stats.totalNoVerificados, hint: `${100 - porcentajeVerificados}% del total`, icon: MailX, color: 'oscuro' },
            { label: 'Activos', value: stats.totalActivos, hint: `${stats.totalInactivos} inactivos`, icon: Shield, color: 'oscuro' },
            { label: 'Local', value: stats.usuariosPorProveedor.LOCAL || 0, hint: 'auth interna', icon: Monitor, color: 'oscuro' },
            { label: 'Google', value: stats.usuariosPorProveedor.GOOGLE || 0, hint: 'OAuth Google', icon: Chrome, color: 'oscuro' },
          ]}
        />
      </div>

      {/* Derecha: donut de distribución por rol */}
      <RolesDonut stats={stats} />
    </div>
  );
}
