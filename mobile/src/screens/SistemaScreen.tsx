import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Activity, Cpu, HardDrive, Timer, Users } from 'lucide-react-native';
import { colors, radius, spacing, utec, themed } from '../theme';
import { AvatarInitials, Card, MetricCard, Screen, Text } from '../components/ui';
import { systemApi } from '../lib/api';
import type { ActiveUsers, Health, Metric } from '../lib/api/system';
import { metricValue } from '../lib/api/system';

function formatBytes(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${n} B`;
}

function formatUptime(seconds: number | null): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export default function SistemaScreen() {
  const [health, setHealth] = useState<Health | null>(null);
  const [active, setActive] = useState<ActiveUsers | null>(null);
  const [memUsed, setMemUsed] = useState<Metric | null>(null);
  const [uptime, setUptime] = useState<Metric | null>(null);
  const [cpu, setCpu] = useState<Metric | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [h, a, mu, up, cu] = await Promise.all([
        systemApi.getHealth().catch(() => null),
        systemApi.getActiveUsers().catch(() => null),
        systemApi.getMetric('jvm.memory.used').catch(() => null),
        systemApi.getMetric('process.uptime').catch(() => null),
        systemApi.getMetric('system.cpu.usage').catch(() => null),
      ]);
      setHealth(h);
      setActive(a);
      setMemUsed(mu);
      setUptime(up);
      setCpu(cu);
      if (!h && !a) setError('No se pudo contactar el panel de sistema.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const up = health?.status === 'UP';
  const cpuPct = metricValue(cpu);

  return (
    <Screen
      loading={loading}
      error={error}
      onRetry={load}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      {/* Estado general */}
      <Card style={[styles.healthCard, { borderColor: up ? utec.green : utec.red }]}>
        <View style={styles.healthRow}>
          <View style={[styles.statusDot, { backgroundColor: up ? utec.green : utec.red }]} />
          <View style={styles.flex}>
            <Text weight="bold" size="xl">
              {up ? 'Operativo' : 'Con problemas'}
            </Text>
            <Text size="sm" muted>
              Estado general del sistema
            </Text>
          </View>
          <Activity size={28} color={up ? utec.green : utec.red} />
        </View>
      </Card>

      {/* Métricas */}
      <View style={styles.metrics}>
        <MetricCard
          label="Memoria"
          value={formatBytes(metricValue(memUsed))}
          color={utec.blue}
          icon={<HardDrive size={16} color="#FFFFFF" />}
        />
        <MetricCard
          label="Uptime"
          value={formatUptime(metricValue(uptime))}
          color={utec.purple}
          icon={<Timer size={16} color="#FFFFFF" />}
        />
        <MetricCard
          label="CPU"
          value={cpuPct != null ? `${(cpuPct * 100).toFixed(0)}%` : '—'}
          color={utec.orange}
          icon={<Cpu size={16} color="#FFFFFF" />}
        />
        <MetricCard
          label="Usuarios activos"
          value={active?.totalActiveUsers ?? 0}
          color={utec.green}
          icon={<Users size={16} color="#FFFFFF" />}
        />
      </View>

      {/* Componentes */}
      {health?.components ? (
        <Card>
          <View style={styles.cardHeader}>
            <Text weight="semibold" size="md">
              Componentes
            </Text>
          </View>
          <View style={styles.list}>
            {Object.entries(health.components).map(([name, comp], i) => (
              <View key={name}>
                {i > 0 ? <View style={styles.sep} /> : null}
                <View style={styles.compRow}>
                  <View
                    style={[
                      styles.compDot,
                      { backgroundColor: comp.status === 'UP' ? utec.green : utec.red },
                    ]}
                  />
                  <Text size="sm" style={styles.flex}>
                    {name}
                  </Text>
                  <Text
                    size="xs"
                    weight="semibold"
                    color={comp.status === 'UP' ? utec.green : utec.red}
                  >
                    {comp.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {/* Usuarios activos */}
      {active && active.activeUsers.length > 0 ? (
        <Card>
          <View style={styles.cardHeader}>
            <Text weight="semibold" size="md">
              Usuarios activos ({active.totalActiveUsers})
            </Text>
          </View>
          <View style={styles.list}>
            {active.activeUsers.map((u, i) => (
              <View key={u.email + i}>
                {i > 0 ? <View style={styles.sep} /> : null}
                <View style={styles.userRow}>
                  <AvatarInitials name={`${u.nombre} ${u.apellido ?? ''}`.trim()} seed={u.email} size={34} />
                  <View style={styles.flex}>
                    <Text size="sm" weight="medium" numberOfLines={1}>
                      {u.nombre} {u.apellido ?? ''}
                    </Text>
                    <Text size="xs" muted numberOfLines={1}>
                      {u.email}
                    </Text>
                  </View>
                  <Text size="xs" muted>
                    {u.rol}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = themed((colors) => StyleSheet.create({
  flex: { flex: 1 },
  healthCard: { borderWidth: 2, padding: spacing[4] },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  cardHeader: { paddingHorizontal: spacing[4], paddingTop: spacing[4] },
  list: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  sep: { height: 1, backgroundColor: colors.border, marginVertical: spacing[1] },
  compRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2] },
  compDot: { width: 8, height: 8, borderRadius: 4 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] },
}));
