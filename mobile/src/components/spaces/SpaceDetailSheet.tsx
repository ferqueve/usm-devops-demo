import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, MapPin, Package, Users, X } from 'lucide-react-native';
import { colors, radius, spacing, utec, themed } from '../../theme';
import { Badge, StatusBadge, Text } from '../ui';
import { inventoryApi } from '../../lib/api';
import type { Espacio, InventarioItem } from '../../lib/types';

export type SpaceDetailSheetProps = {
  espacio: Espacio | null;
  visible: boolean;
  onClose: () => void;
};

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldIcon}>{icon}</View>
      <View style={styles.fieldBody}>
        <Text size="xs" muted>
          {label}
        </Text>
        <Text size="sm" weight="medium">
          {value}
        </Text>
      </View>
    </View>
  );
}

export function SpaceDetailSheet({ espacio, visible, onClose }: SpaceDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!espacio || !visible) return;
    let cancelled = false;
    setLoading(true);
    setInventario([]);
    inventoryApi
      .listarInventarioPorEspacio(espacio.id)
      .then((items) => {
        if (!cancelled) setInventario(items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [espacio, visible]);

  if (!espacio) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text weight="bold" size="lg" style={styles.flex} numberOfLines={2}>
              {espacio.nombre}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={styles.badges}>
            <StatusBadge status={espacio.estado} />
            {espacio.tipoEspacioNombre ? (
              <Badge
                label={espacio.tipoEspacioNombre}
                color={espacio.tipoEspacioColor || utec.blue}
              />
            ) : null}
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Field
              icon={<Users size={16} color={utec.blue} />}
              label="Capacidad"
              value={`${espacio.capacidad} personas`}
            />
            {espacio.edificioNombre ? (
              <Field
                icon={<MapPin size={16} color={utec.blue} />}
                label="Edificio"
                value={`${espacio.edificioNombre}${espacio.edificioCodigo ? ` (${espacio.edificioCodigo})` : ''}`}
              />
            ) : null}
            <Field
              icon={<Building2 size={16} color={utec.blue} />}
              label="Tipo"
              value={espacio.tipoEspacioNombre ?? 'Espacio'}
            />

            {/* Inventario del espacio */}
            <View style={styles.invHeader}>
              <Package size={16} color={colors.foreground} />
              <Text weight="semibold" size="sm" style={styles.flex}>
                Inventario
              </Text>
              {loading ? <ActivityIndicator size="small" color={utec.blue} /> : (
                <Text size="xs" muted>
                  {inventario.length}
                </Text>
              )}
            </View>
            {!loading && inventario.length === 0 ? (
              <Text size="sm" muted>
                Este espacio no tiene inventario asignado.
              </Text>
            ) : (
              inventario.map((it) => (
                <View key={it.id} style={styles.invRow}>
                  <Text size="sm" style={styles.flex}>
                    {it.cantidad}× {it.tipoElementoNombre}
                  </Text>
                  <StatusBadge status={it.estado} />
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = themed((colors) => StyleSheet.create({
  flex: { flex: 1 },
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  badges: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[2] },
  body: { marginTop: spacing[3] },
  bodyContent: { gap: spacing[3], paddingBottom: spacing[2] },
  field: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBody: { flex: 1, gap: 1 },
  invHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  invRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
}));
