import { Pressable, StyleSheet, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { colors, fontSize, spacing, utec, themed } from '../../theme';
import { Text, StatusBadge } from '../ui';
import { formatDuracion, formatFechaCorta, formatHora } from '../../lib/format';
import type { Reserva } from '../../lib/types';

export type ReservationRowProps = {
  reserva: Reserva;
  onPress?: (r: Reserva) => void;
  /** Muestra el badge de estado en vez de la duración. */
  showEstado?: boolean;
};

export function ReservationRow({ reserva, onPress, showEstado }: ReservationRowProps) {
  const accent = reserva.tipoEspacioColor || utec.blue;
  return (
    <Pressable
      onPress={onPress ? () => onPress(reserva) : undefined}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
    >
      {/* Hora */}
      <View style={styles.timeCol}>
        <Text weight="bold" size="sm">
          {formatHora(reserva.inicio)}
        </Text>
        <Text size="xs" muted>
          {formatFechaCorta(reserva.inicio)}
        </Text>
      </View>

      {/* Barra de color por tipo de espacio */}
      <View style={[styles.bar, { backgroundColor: accent }]} />

      {/* Contenido */}
      <View style={styles.main}>
        <Text weight="semibold" size="sm" numberOfLines={1}>
          {reserva.titulo}
        </Text>
        <View style={styles.subRow}>
          <Text size="xs" muted numberOfLines={1} style={styles.subText}>
            {reserva.espacioNombre} · {formatDuracion(reserva.inicio, reserva.fin)}
          </Text>
        </View>
      </View>

      {/* Derecha: estado o capacidad */}
      {showEstado ? (
        <StatusBadge status={reserva.estado} />
      ) : reserva.capacidadEspacio ? (
        <View style={styles.cap}>
          <Users size={12} color={colors.mutedForeground} />
          <Text size="xs" muted>
            {reserva.capacidadEspacio}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = themed((colors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2.5],
  },
  pressed: { opacity: 0.6 },
  timeCol: { width: 44, alignItems: 'flex-start' },
  bar: { width: 3, alignSelf: 'stretch', borderRadius: 2, minHeight: 32 },
  main: { flex: 1, gap: 2 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  subText: { flex: 1, fontSize: fontSize.xs },
  cap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
}));
