import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarClock, Inbox } from 'lucide-react-native';
import { colors, spacing, utec, themed } from '../theme';
import { Card, EmptyState, MetricCard, Screen, Text } from '../components/ui';
import { ReservationRow } from '../components/reservations/ReservationRow';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../lib/api';
import type { DashboardData, Tone } from '../lib/api/dashboard';
import { rolLabel } from '../lib/format';

const TONE: Record<Tone, string> = {
  green: utec.green,
  yellow: utec.yellow,
  orange: utec.orange,
  red: utec.red,
  blue: utec.blue,
  cyan: utec.cyan,
  dark: utec.dark,
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const d = await dashboardApi.obtenerDashboard(user.rol);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return (
    <Screen
      loading={loading}
      error={error}
      onRetry={load}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Saludo */}
      <View>
        <Text weight="bold" size="2xl">
          Hola, {user?.nombre?.split(' ')[0] ?? 'Usuario'}
        </Text>
        <Text muted size="sm">
          {user ? rolLabel(user.rol) : ''} · Resumen de hoy
        </Text>
      </View>

      {/* Métricas */}
      <View style={styles.metrics}>
        {data?.metrics.map((m) => (
          <MetricCard
            key={m.key}
            label={m.label}
            value={m.value}
            sub={m.sub}
            color={TONE[m.tone]}
          />
        ))}
      </View>

      {/* Cola */}
      <Card>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <Inbox size={16} color={colors.foreground} />
            <Text weight="semibold" size="md">
              {data?.colaLabel ?? 'Cola'}
            </Text>
          </View>
          <Text size="xs" muted>
            {data?.cola.length ?? 0}
          </Text>
        </View>
        {data && data.cola.length > 0 ? (
          <View style={styles.list}>
            {data.cola.slice(0, 6).map((r, i) => (
              <View key={r.id}>
                {i > 0 ? <View style={styles.sep} /> : null}
                <ReservationRow reserva={r} showEstado />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title="Sin pendientes" description="No hay reservas en cola." />
        )}
      </Card>

      {/* Hoy / Próximas */}
      <Card>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <CalendarClock size={16} color={colors.foreground} />
            <Text weight="semibold" size="md">
              {data?.hoyLabel ?? 'Hoy'}
            </Text>
          </View>
          <Text size="xs" muted>
            {data?.hoy.length ?? 0}
          </Text>
        </View>
        {data && data.hoy.length > 0 ? (
          <View style={styles.list}>
            {data.hoy.slice(0, 6).map((r, i) => (
              <View key={r.id}>
                {i > 0 ? <View style={styles.sep} /> : null}
                <ReservationRow reserva={r} />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title="Nada por hoy" description="No hay reservas programadas." />
        )}
      </Card>
    </Screen>
  );
}

const styles = themed((colors) => StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  list: { paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
  sep: { height: 1, backgroundColor: colors.border },
}));
