import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { colors, radius, spacing, utec, themed } from '../theme';
import { Card, EmptyState, Fab, Text } from '../components/ui';
import { ReservationRow } from '../components/reservations/ReservationRow';
import { ReservationDetailSheet } from '../components/reservations/ReservationDetailSheet';
import { ReservaFormModal } from '../components/reservations/ReservaFormModal';
import { useAuth } from '../contexts/AuthContext';
import { reservationsApi } from '../lib/api';
import type { Reserva, ReservaEstado } from '../lib/types';

type Filtro = 'TODOS' | ReservaEstado;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'TODOS', label: 'Todas' },
  { id: 'PENDIENTE', label: 'Pendientes' },
  { id: 'APROBADO', label: 'Aprobadas' },
  { id: 'CANCELADO', label: 'Canceladas' },
];

const PAGE_SIZE = 20;

export default function ReservasScreen() {
  const { user } = useAuth();
  const isManager =
    user?.rol === 'ADMIN' || user?.rol === 'ANALISTA' || user?.rol === 'MANTENIMIENTO';
  const canManage = user?.rol === 'ADMIN' || user?.rol === 'ANALISTA';
  const canCreate =
    user?.rol === 'ADMIN' || user?.rol === 'ANALISTA' || user?.rol === 'MANTENIMIENTO';
  const [showForm, setShowForm] = useState(false);

  const [items, setItems] = useState<Reserva[]>([]);
  const [misReservas, setMisReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);
  const [selected, setSelected] = useState<Reserva | null>(null);

  const fetchManager = useCallback(
    async (pageToLoad: number, estado: Filtro) => {
      const res = await reservationsApi.obtenerTodasReservasPaged({
        page: pageToLoad,
        size: PAGE_SIZE,
        estado: estado === 'TODOS' ? undefined : estado,
      });
      setLast(res.last);
      setPage(res.page);
      setItems((prev) => (pageToLoad === 0 ? res.content : [...prev, ...res.content]));
    },
    [],
  );

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      if (isManager) {
        await fetchManager(0, filtro);
      } else {
        const mias = await reservationsApi.obtenerMisReservas();
        setMisReservas(mias);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las reservas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isManager, filtro, fetchManager]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!isManager || last || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchManager(page + 1, filtro);
    } catch {
      // silencioso; el refresh reintenta
    } finally {
      setLoadingMore(false);
    }
  }, [isManager, last, loadingMore, page, filtro, fetchManager]);

  // Para roles consumidores: filtrado client-side de "mis reservas".
  const data = useMemo(() => {
    if (isManager) return items;
    if (filtro === 'TODOS') return misReservas;
    return misReservas.filter((r) => r.estado === filtro);
  }, [isManager, items, misReservas, filtro]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={utec.blue} />
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text size="sm" muted>
              {isManager ? 'Gestión de reservas' : 'Mis reservas'}
            </Text>
            <View style={styles.chips}>
              {FILTROS.map((f) => {
                const active = filtro === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setFiltro(f.id)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      size="xs"
                      weight="medium"
                      color={active ? colors.primaryForeground : colors.foreground}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <View style={styles.rowInner}>
              <ReservationRow reserva={item} showEstado onPress={() => setSelected(item)} />
            </View>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={utec.blue} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={<BookOpen size={24} color={colors.mutedForeground} />}
            title={error ? 'Algo salió mal' : 'Sin reservas'}
            description={error ?? 'No hay reservas para este filtro.'}
          />
        }
      />

      <ReservationDetailSheet
        reserva={selected}
        visible={selected !== null}
        canManage={canManage}
        onClose={() => setSelected(null)}
        onChanged={onRefresh}
      />

      {canCreate ? <Fab onPress={() => setShowForm(true)} /> : null}
      <ReservaFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onCreated={onRefresh}
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
  header: { gap: spacing[3], marginBottom: spacing[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rowCard: { paddingHorizontal: 0, paddingVertical: 0 },
  rowInner: { paddingHorizontal: spacing[3] },
  footer: { paddingVertical: spacing[4] },
}));
