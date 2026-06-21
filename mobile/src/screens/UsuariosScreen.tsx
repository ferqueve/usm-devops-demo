import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { BadgeCheck, Users as UsersIcon } from 'lucide-react-native';
import { colors, radius, spacing, utec, themed } from '../theme';
import { AvatarInitials, Badge, Card, EmptyState, MetricCard, Text } from '../components/ui';
import { UserEditSheet } from '../components/users/UserEditSheet';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../lib/api';
import { rolLabel } from '../lib/format';
import type { Usuario, UserRole, UserStats } from '../lib/types';

const ROLES: (UserRole | 'TODOS')[] = [
  'TODOS',
  'ADMIN',
  'ANALISTA',
  'DOCENTE',
  'ESTUDIANTE',
  'EXTERNO',
  'MANTENIMIENTO',
];

const ROLE_COLOR: Record<UserRole, string> = {
  ADMIN: utec.red,
  ANALISTA: utec.blue,
  DOCENTE: utec.green,
  ESTUDIANTE: utec.cyan,
  EXTERNO: utec.purple,
  MANTENIMIENTO: utec.orange,
};

const PAGE_SIZE = 20;

function UserCard({
  user,
  onToggle,
  onEdit,
}: {
  user: Usuario;
  onToggle: (u: Usuario) => void;
  onEdit?: (u: Usuario) => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Pressable
          style={styles.editArea}
          onPress={onEdit ? () => onEdit(user) : undefined}
          disabled={!onEdit}
        >
          <AvatarInitials name={user.nombre} seed={user.email} size={42} />
          <View style={styles.main}>
          <View style={styles.nameRow}>
            <Text weight="semibold" size="sm" numberOfLines={1} style={styles.name}>
              {user.nombre}
            </Text>
            {user.verificado ? <BadgeCheck size={14} color={utec.green} /> : null}
          </View>
          <Text size="xs" muted numberOfLines={1}>
            {user.email}
          </Text>
          <View style={styles.badges}>
            <Badge label={rolLabel(user.rolApp)} color={ROLE_COLOR[user.rolApp]} />
          </View>
          </View>
        </Pressable>
        <View style={styles.right}>
          <Switch
            value={user.activo}
            onValueChange={() => onToggle(user)}
            trackColor={{ true: utec.green, false: colors.border }}
            thumbColor="#FFFFFF"
          />
          <Text size="xs" muted>
            {user.activo ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export default function UsuariosScreen() {
  const { user: current } = useAuth();
  const canManage = current?.rol === 'ADMIN';
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [items, setItems] = useState<Usuario[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rol, setRol] = useState<UserRole | 'TODOS'>('TODOS');
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);

  const fetchPage = useCallback(async (pageToLoad: number, rolFilter: UserRole | 'TODOS') => {
    const res = await usersApi.listarUsuarios(pageToLoad, PAGE_SIZE, {
      rolApp: rolFilter === 'TODOS' ? undefined : rolFilter,
    });
    setLast(res.last);
    setPage(res.page);
    setItems((prev) => (pageToLoad === 0 ? res.content : [...prev, ...res.content]));
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [, st] = await Promise.all([
        fetchPage(0, rol),
        usersApi.obtenerEstadisticasUsuarios().catch(() => null),
      ]);
      setStats(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rol, fetchPage]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (last || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(page + 1, rol);
    } catch {
      // silencioso
    } finally {
      setLoadingMore(false);
    }
  }, [last, loadingMore, page, rol, fetchPage]);

  const onToggle = useCallback(async (u: Usuario) => {
    // Optimista
    setItems((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: !x.activo } : x)));
    try {
      await usersApi.toggleActivo(u.id);
    } catch {
      // revertir
      setItems((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: u.activo } : x)));
    }
  }, []);

  const metrics = useMemo(() => {
    if (!stats) return [];
    return [
      { key: 't', label: 'Total', value: stats.totalUsuarios, color: utec.blue },
      { key: 'a', label: 'Activos', value: stats.totalActivos, color: utec.green },
      { key: 'v', label: 'Verificados', value: stats.totalVerificados, color: utec.cyan },
      { key: 'i', label: 'Inactivos', value: stats.totalInactivos, color: utec.orange },
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {ROLES.map((r) => {
                const active = rol === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRol(r)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      size="xs"
                      weight="medium"
                      color={active ? colors.primaryForeground : colors.foreground}
                    >
                      {r === 'TODOS' ? 'Todos' : rolLabel(r)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onToggle={onToggle}
            onEdit={canManage ? setEditUser : undefined}
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
            icon={<UsersIcon size={24} color={colors.mutedForeground} />}
            title={error ? 'Algo salió mal' : 'Sin usuarios'}
            description={error ?? 'No hay usuarios para este filtro.'}
          />
        }
      />

      <UserEditSheet
        user={editUser}
        visible={editUser !== null}
        onClose={() => setEditUser(null)}
        onSaved={() => {
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
  header: { gap: spacing[3], marginBottom: spacing[3] },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  chips: { gap: spacing[2], paddingRight: spacing[4] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  card: { paddingVertical: spacing[3], paddingHorizontal: spacing[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  editArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  main: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  name: { flexShrink: 1 },
  badges: { flexDirection: 'row', gap: spacing[1], marginTop: spacing[1] },
  right: { alignItems: 'center', gap: spacing[1] },
  footer: { paddingVertical: spacing[4] },
}));
