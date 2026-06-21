import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { colors, spacing, utec, themed } from '../theme';
import { Card, EmptyState, Text } from '../components/ui';
import { ReservationRow } from '../components/reservations/ReservationRow';
import { ReservationDetailSheet } from '../components/reservations/ReservationDetailSheet';
import { reservationsApi } from '../lib/api';
import { formatFechaLarga } from '../lib/format';
import type { Reserva } from '../lib/types';

type Section = { title: string; data: Reserva[] };

function startOfToday(): number {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
}

export default function CalendarioScreen() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Reserva | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await reservationsApi.obtenerTodasReservasPaged({
        estado: 'APROBADO',
        size: 200,
      });
      setReservas(res.content);
    } catch (e) {
      // Fallback para roles sin acceso a la gestión: sus propias reservas.
      try {
        const mias = await reservationsApi.obtenerMisReservas();
        setReservas(mias.filter((r) => r.estado === 'APROBADO'));
      } catch {
        setError(e instanceof Error ? e.message : 'No se pudo cargar el calendario.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sections: Section[] = useMemo(() => {
    const min = startOfToday();
    const groups = new Map<string, Reserva[]>();
    reservas
      .filter((r) => new Date(r.inicio).getTime() >= min)
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
      .forEach((r) => {
        const key = new Date(r.inicio).toISOString().slice(0, 10);
        const arr = groups.get(key) ?? [];
        arr.push(r);
        groups.set(key, arr);
      });
    return Array.from(groups.entries()).map(([key, data]) => ({
      title: formatFechaLarga(`${key}T12:00:00`),
      data,
    }));
  }, [reservas]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={utec.blue} />
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <CalendarDays size={14} color={utec.blue} />
            <Text weight="semibold" size="sm" style={styles.sectionTitle}>
              {section.title.charAt(0).toUpperCase() + section.title.slice(1)}
            </Text>
            <Text size="xs" muted>
              {section.data.length}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <View style={styles.rowInner}>
              <ReservationRow reserva={item} onPress={() => setSelected(item)} />
            </View>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
        SectionSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
        ListEmptyComponent={
          <EmptyState
            icon={<CalendarDays size={24} color={colors.mutedForeground} />}
            title={error ? 'Algo salió mal' : 'Sin reservas próximas'}
            description={error ?? 'No hay reservas confirmadas de hoy en adelante.'}
          />
        }
      />

      <ReservationDetailSheet
        reserva={selected}
        visible={selected !== null}
        onClose={() => setSelected(null)}
        onChanged={() => {
          setRefreshing(true);
          load();
        }}
      />
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.secondary },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  list: { padding: spacing[4] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  sectionTitle: { flex: 1 },
  rowCard: { paddingHorizontal: 0, paddingVertical: 0 },
  rowInner: { paddingHorizontal: spacing[3] },
}));
