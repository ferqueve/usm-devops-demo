import { Pressable, StyleSheet, View } from 'react-native';
import { Building2, Eye, MapPin, Pencil, Users } from 'lucide-react-native';
import { colors, radius, shadow, spacing, utec, themed } from '../../theme';
import { Badge, Button, StatusBadge, Text } from '../ui';
import type { Espacio } from '../../lib/types';

export type SpaceCardProps = {
  espacio: Espacio;
  onPress?: (e: Espacio) => void;
  onEdit?: (e: Espacio) => void;
  canEdit?: boolean;
};

export function SpaceCard({ espacio, onPress, onEdit, canEdit }: SpaceCardProps) {
  return (
    <View style={styles.card}>
      {/* Área de imagen / placeholder oscuro */}
      <View style={styles.image}>
        <Building2 size={36} color="rgba(255,255,255,0.35)" />
        <Text size="xs" weight="semibold" color="rgba(255,255,255,0.5)" style={styles.imageLabel}>
          {(espacio.tipoEspacioNombre ?? 'Espacio').toUpperCase()}
        </Text>
        <View style={styles.statusAbs}>
          <StatusBadge status={espacio.estado} />
        </View>
      </View>

      {/* Cuerpo */}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text weight="semibold" size="sm" numberOfLines={1} style={styles.name}>
            {espacio.nombre}
          </Text>
          {espacio.tipoEspacioNombre ? (
            <Badge label={espacio.tipoEspacioNombre} color={espacio.tipoEspacioColor || utec.blue} />
          ) : null}
        </View>

        <View style={styles.metaRow}>
          {espacio.edificioNombre ? (
            <View style={styles.meta}>
              <MapPin size={12} color={colors.mutedForeground} />
              <Text size="xs" muted numberOfLines={1}>
                {espacio.edificioNombre}
              </Text>
            </View>
          ) : null}
          <View style={styles.meta}>
            <Users size={12} color={colors.mutedForeground} />
            <Text size="xs" muted>
              {espacio.capacidad}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Ver"
            variant="outline"
            size="sm"
            style={styles.actionBtn}
            icon={<Eye size={14} color={colors.foreground} />}
            onPress={onPress ? () => onPress(espacio) : undefined}
          />
          {canEdit ? (
            <Button
              title="Editar"
              variant="outline"
              size="sm"
              style={styles.actionBtn}
              icon={<Pencil size={14} color={colors.foreground} />}
              onPress={onEdit ? () => onEdit(espacio) : undefined}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  image: {
    height: 110,
    backgroundColor: utec.dark,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  imageLabel: { letterSpacing: 1 },
  statusAbs: { position: 'absolute', top: spacing[2], right: spacing[2] },
  body: { padding: spacing[3], gap: spacing[2] },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  name: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], flexShrink: 1 },
  actions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[1] },
  actionBtn: { flex: 1 },
}));
