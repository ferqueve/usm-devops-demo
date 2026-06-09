import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Boxes, Package } from 'lucide-react-native';
import { colors, radius, spacing, utec, themed } from '../theme';
import { Card, EmptyState, Fab, MetricCard, StatusBadge, Text } from '../components/ui';
import { InventarioFormModal } from '../components/inventory/InventarioFormModal';
import { useAuth } from '../contexts/AuthContext';
import { inventoryApi } from '../lib/api';
import type { InventarioItem, InventarioStats } from '../lib/types';

type Filtro = 'TODOS' | 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'DISPONIBLE', label: 'Disponibles' },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { id: 'DANADO', label: 'Dañados' },
];

const PAGE_SIZE = 20;

function ItemCard({ item, onPress }: { item: InventarioItem; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => pressed && onPress ? styles.pressed : null}>
    <Card style={styles.itemCard}>
      <View style={styles.itemRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: (item.espacioColor || utec.blue) + '22' },
          ]}
        >
          <Package size={18} color={item.espacioColor || utec.blue} />
        </View>
        <View style={styles.itemMain}>
          <Text weight="semibold" size="sm" numberOfLines={1}>
            {item.tipoElementoNombre}
          </Text>
          <Text size="xs" muted numberOfLines={1}>
            {item.espacioNombre || 'Sin asignar'}
          </Text>
        </View>
        <View style={styles.itemRight}>
          <Text weight="bold" size="lg">
            {item.cantidad}
          </Text>
          <StatusBadge status={item.estado} />
        </View>
      </View>
    </Card>
    </Pressable>
  );
}

export default function InventarioScreen() {
  const { user } = useAuth();
  const canEdit = user?.rol === 'ADMIN' || user?.rol === 'MANTENIMIENTO';
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventarioItem | null>(null);
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [stats, setStats] = useState<InventarioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);

  const fetchPage = useCallback(async (pageToLoad: number, estado: Filtro) => {
    const res = await inventoryApi.listarInventario(pageToLoad, PAGE_SIZE, {
      estado: estado === 'TODOS' ? undefined : estado,
    });
    setLast(res.last);
    setPage(res.page);
    setItems((prev) => (pageToLoad === 0 ? res.content : [...prev, ...res.content]));
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [, st] = await Promise.all([
        fetchPage(0, filtro),
        inventoryApi.obtenerEstadisticasInventario().catch(() => null),
      ]);
      setStats(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el inventario.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtro, fetchPage]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (last || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(page + 1, filtro);
    } catch {
      // silencioso
    } finally {
      setLoadingMore(false);
    }
  }, [last, loadingMore, page, filtro, fetchPage]);

  const metrics = useMemo(() => {
    if (!stats) return [];
    return [
      { key: 't', label: 'Total', value: stats.totalItems, color: utec.blue },
      { key: 'd', label: 'Disponibles', value: stats.disponibles, color: utec.green },
      { key: 'm', label: 'Mantenimiento', value: stats.mantenimiento, color: utec.orange },
      { key: 'x', label: 'Dañados', value: stats.danados, color: utec.red },
    ];
  }, [stats]);

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
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.metrics}>
              {metrics.map((m) => (
                <MetricCard key={m.key} label={m.label} value={m.value} color={m.color} />
              ))}
            </View>
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
          <ItemCard
            item={item}
            onPress={
              canEdit
                ? () => {
                    setEditing(item);
                    setFormOpen(true);
                  }
                : undefined
            }
          />
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
            icon={<Boxes size={24} color={colors.mutedForeground} />}
            title={error ? 'Algo salió mal' : 'Sin inventario'}
            description={error ?? 'No hay items para este filtro.'}
          />
        }
      />

      {canEdit ? (
        <Fab
          onPress={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        />
      ) : null}
      <InventarioFormModal
        visible={formOpen}
        item={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
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
  header: { gap: spacing[3], marginBottom: spacing[3] },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
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
  pressed: { opacity: 0.6 },
  itemCard: { paddingVertical: spacing[3], paddingHorizontal: spacing[3] },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMain: { flex: 1, gap: 1 },
  itemRight: { alignItems: 'flex-end', gap: spacing[1] },
  footer: { paddingVertical: spacing[4] },
}));
