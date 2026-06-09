import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Building2, Search } from 'lucide-react-native';
import { colors, radius, spacing, utec, themed } from '../theme';
import { EmptyState, Fab, Input, Text } from '../components/ui';
import { SpaceCard } from '../components/spaces/SpaceCard';
import { SpaceDetailSheet } from '../components/spaces/SpaceDetailSheet';
import { EspacioFormModal } from '../components/spaces/EspacioFormModal';
import { useAuth } from '../contexts/AuthContext';
import { spacesApi } from '../lib/api';
import type { Espacio, EspacioEstado } from '../lib/types';

type Filtro = 'TODOS' | EspacioEstado;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'DISPONIBLE', label: 'Disponibles' },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { id: 'NO_DISPONIBLE', label: 'No disponibles' },
];

export default function EspaciosScreen() {
  const { user } = useAuth();
  const canEdit = user?.rol === 'ADMIN' || user?.rol === 'MANTENIMIENTO';

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [selected, setSelected] = useState<Espacio | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Espacio | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await spacesApi.obtenerEspacios();
      setEspacios(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los espacios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return espacios.filter((e) => {
      if (filtro !== 'TODOS' && e.estado !== filtro) return false;
      if (q && !e.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [espacios, query, filtro]);

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
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        numColumns={1}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text size="sm" muted>
              {filtered.length} espacio{filtered.length === 1 ? '' : 's'}
              {filtro !== 'TODOS' || query ? ` · de ${espacios.length}` : ''}
            </Text>
            <Input
              placeholder="Buscar por nombre…"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              rightSlot={<Search size={18} color={colors.mutedForeground} />}
            />
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
          <View style={styles.cardWrap}>
            <SpaceCard
              espacio={item}
              canEdit={canEdit}
              onPress={setSelected}
              onEdit={(e) => {
                setEditing(e);
                setFormOpen(true);
              }}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<Building2 size={24} color={colors.mutedForeground} />}
            title={error ? 'Algo salió mal' : 'Sin espacios'}
            description={error ?? 'No hay espacios que coincidan con tu búsqueda.'}
          />
        }
      />

      <SpaceDetailSheet
        espacio={selected}
        visible={selected !== null}
        onClose={() => setSelected(null)}
      />

      {canEdit ? (
        <Fab
          onPress={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        />
      ) : null}
      <EspacioFormModal
        visible={formOpen}
        espacio={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.secondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary },
  list: { padding: spacing[4], gap: spacing[3] },
  header: { gap: spacing[3], marginBottom: spacing[1] },
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
  cardWrap: { marginBottom: spacing[3] },
}));
