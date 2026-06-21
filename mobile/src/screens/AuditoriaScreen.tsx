import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, X } from 'lucide-react-native';
import { colors, radius, spacing, utec, themed } from '../theme';
import { Badge, Card, EmptyState, Text } from '../components/ui';
import { auditApi } from '../lib/api';
import { formatHora } from '../lib/format';
import type { AuditLog, AuditLogAccion } from '../lib/types';

type Filtro = 'TODOS' | AuditLogAccion;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'TODOS', label: 'Todas' },
  { id: 'CREATE', label: 'Creación' },
  { id: 'UPDATE', label: 'Edición' },
  { id: 'DELETE', label: 'Borrado' },
];

const ACCION_COLOR: Record<AuditLogAccion, string> = {
  CREATE: utec.green,
  UPDATE: utec.blue,
  DELETE: utec.red,
};

const ACCION_LABEL: Record<AuditLogAccion, string> = {
  CREATE: 'Creó',
  UPDATE: 'Editó',
  DELETE: 'Borró',
};

const PAGE_SIZE = 20;

function pretty(json: string | null): string | null {
  if (!json) return null;
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

function fecha(ts: string): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })} · ${formatHora(d)}`;
}

export default function AuditoriaScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const fetchPage = useCallback(async (pageToLoad: number, accion: Filtro) => {
    const res = await auditApi.listarLogsAuditoria(pageToLoad, PAGE_SIZE, {
      accion: accion === 'TODOS' ? undefined : accion,
    });
    setLast(res.last);
    setPage(res.page);
    setItems((prev) => (pageToLoad === 0 ? res.content : [...prev, ...res.content]));
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      await fetchPage(0, filtro);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la auditoría.');
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
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <Badge label={ACCION_LABEL[item.accion]} color={ACCION_COLOR[item.accion]} />
                <Text weight="semibold" size="sm" style={styles.entidad} numberOfLines={1}>
                  {item.entidad}
                  {item.entidadId ? ` #${item.entidadId}` : ''}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text size="xs" muted numberOfLines={1} style={styles.flex}>
                  {item.usuarioNombre ?? 'Sistema'}
                </Text>
                <Text size="xs" muted>
                  {fecha(item.timestamp)}
                </Text>
              </View>
            </Card>
          </Pressable>
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
            icon={<FileText size={24} color={colors.mutedForeground} />}
            title={error ? 'Algo salió mal' : 'Sin registros'}
            description={error ?? 'No hay registros de auditoría para este filtro.'}
          />
        }
      />

      {/* Detalle */}
      <Modal
        visible={selected !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTouch} onPress={() => setSelected(null)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
            <View style={styles.handle} />
            {selected ? (
              <>
                <View style={styles.sheetHeader}>
                  <Badge
                    label={ACCION_LABEL[selected.accion]}
                    color={ACCION_COLOR[selected.accion]}
                  />
                  <Text weight="bold" size="md" style={styles.flex} numberOfLines={1}>
                    {selected.entidad}
                    {selected.entidadId ? ` #${selected.entidadId}` : ''}
                  </Text>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <X size={20} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                <Text size="xs" muted>
                  {selected.usuarioNombre ?? 'Sistema'}
                  {selected.usuarioEmail ? ` · ${selected.usuarioEmail}` : ''} · {fecha(selected.timestamp)}
                </Text>
                <ScrollView style={styles.json} contentContainerStyle={styles.jsonContent}>
                  {pretty(selected.datosPrevios) ? (
                    <View style={styles.jsonBlock}>
                      <Text size="xs" muted style={styles.jsonLabel}>
                        Datos previos
                      </Text>
                      <Text style={styles.code}>{pretty(selected.datosPrevios)}</Text>
                    </View>
                  ) : null}
                  {pretty(selected.datosNuevos) ? (
                    <View style={styles.jsonBlock}>
                      <Text size="xs" muted style={styles.jsonLabel}>
                        Datos nuevos
                      </Text>
                      <Text style={styles.code}>{pretty(selected.datosNuevos)}</Text>
                    </View>
                  ) : null}
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  card: { paddingVertical: spacing[3], paddingHorizontal: spacing[3], gap: spacing[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  entidad: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  flex: { flex: 1 },
  footer: { paddingVertical: spacing[4] },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdropTouch: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing[3],
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  json: { marginTop: spacing[3] },
  jsonContent: { gap: spacing[3], paddingBottom: spacing[2] },
  jsonBlock: { gap: spacing[1] },
  jsonLabel: {},
  code: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.foreground,
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    padding: spacing[3],
  },
}));
