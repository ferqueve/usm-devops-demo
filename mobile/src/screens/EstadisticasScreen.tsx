import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, utec, themed } from '../theme';
import { BarChart, Card, MetricCard, Screen, Text } from '../components/ui';
import type { BarDatum } from '../components/ui/BarChart';
import { useAuth } from '../contexts/AuthContext';
import { inventoryApi, statsApi } from '../lib/api';
import type { InventarioStats } from '../lib/types';
import type { OcupacionEspacio, ResumenCarrera, ResumenEdificio } from '../lib/api/stats';

type Tab = 'reservas' | 'inventario';

function ChartCard({ title, data, max }: { title: string; data: BarDatum[]; max?: number }) {
  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text weight="semibold" size="md">
          {title}
        </Text>
      </View>
      <View style={styles.cardBody}>
        {data.length > 0 ? (
          <BarChart data={data} max={max} />
        ) : (
          <Text size="sm" muted>
            Sin datos en el período.
          </Text>
        )}
      </View>
    </Card>
  );
}

export default function EstadisticasScreen() {
  const { user } = useAuth();
  const canReservas = user?.rol === 'ADMIN' || user?.rol === 'ANALISTA';
  const canInventario = user?.rol === 'ADMIN' || user?.rol === 'MANTENIMIENTO';

  const [tab, setTab] = useState<Tab>(canReservas ? 'reservas' : 'inventario');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ocupacion, setOcupacion] = useState<OcupacionEspacio[]>([]);
  const [edificios, setEdificios] = useState<ResumenEdificio[]>([]);
  const [carreras, setCarreras] = useState<ResumenCarrera[]>([]);
  const [invStats, setInvStats] = useState<InventarioStats | null>(null);

  const { desde, hasta } = useMemo(() => {
    const y = new Date().getFullYear();
    return { desde: `${y}-01-01`, hasta: `${y}-12-31` };
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const tasks: Promise<unknown>[] = [];
      if (canReservas) {
        tasks.push(
          statsApi.ocupacionPorEspacio(desde, hasta).then(setOcupacion).catch(() => {}),
          statsApi.resumenPorEdificio(desde, hasta).then(setEdificios).catch(() => {}),
          statsApi.resumenPorCarrera(desde, hasta).then(setCarreras).catch(() => {}),
        );
      }
      if (canInventario) {
        tasks.push(
          inventoryApi.obtenerEstadisticasInventario().then(setInvStats).catch(() => {}),
        );
      }
      await Promise.all(tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las estadísticas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canReservas, canInventario, desde, hasta]);

  useEffect(() => {
    load();
  }, [load]);

  const ocupacionData: BarDatum[] = ocupacion
    .slice()
    .sort((a, b) => b.porcentaje - a.porcentaje)
    .slice(0, 6)
    .map((o) => ({
      label: o.espacioNombre,
      value: o.porcentaje,
      display: `${o.porcentaje.toFixed(1)}%`,
      color: utec.green,
    }));

  const edificioData: BarDatum[] = edificios
    .slice()
    .sort((a, b) => b.cantReservas - a.cantReservas)
    .slice(0, 6)
    .map((e) => ({ label: e.edificioNombre, value: e.cantReservas, color: utec.blue }));

  const carreraData: BarDatum[] = carreras
    .slice()
    .sort((a, b) => b.aprobadas - a.aprobadas)
    .slice(0, 6)
    .map((c) => ({ label: c.carreraNombre, value: c.aprobadas, color: utec.cyan }));

  const invData: BarDatum[] = invStats
    ? [
        { label: 'Disponibles', value: invStats.disponibles, color: utec.green },
        { label: 'Mantenimiento', value: invStats.mantenimiento, color: utec.orange },
        { label: 'Dañados', value: invStats.danados, color: utec.red },
        { label: 'Sin asignar', value: invStats.sinAsignar, color: utec.purple },
      ]
    : [];

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
      {/* Tabs (solo las accesibles) */}
      {canReservas && canInventario ? (
        <View style={styles.tabs}>
          {(['reservas', 'inventario'] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text
                  size="sm"
                  weight="medium"
                  color={active ? colors.primaryForeground : colors.foreground}
                >
                  {t === 'reservas' ? 'Reservas' : 'Inventario'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {tab === 'reservas' && canReservas ? (
        <>
          <ChartCard title="Ocupación por espacio" data={ocupacionData} max={100} />
          <ChartCard title="Reservas por edificio" data={edificioData} />
          <ChartCard title="Top carreras (aprobadas)" data={carreraData} />
        </>
      ) : null}

      {tab === 'inventario' && canInventario ? (
        <>
          {invStats ? (
            <View style={styles.metrics}>
              <MetricCard label="Total" value={invStats.totalItems} color={utec.blue} />
              <MetricCard label="Disponibles" value={invStats.disponibles} color={utec.green} />
            </View>
          ) : null}
          <ChartCard title="Inventario por estado" data={invData} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = themed((colors) => StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: spacing[1],
    gap: spacing[1],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  cardHeader: { paddingHorizontal: spacing[4], paddingTop: spacing[4] },
  cardBody: { paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  metrics: { flexDirection: 'row', gap: spacing[3] },
}));
