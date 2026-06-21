import { View, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, radius, spacing, statusColor, themed } from '../../theme';
import type { StatusKey } from '../../theme';
import { Text } from './Text';

/** Convierte un hex (#RRGGBB) a rgba con alpha. */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const LABELS: Partial<Record<string, string>> = {
  DISPONIBLE: 'Disponible',
  MANTENIMIENTO: 'Mantenimiento',
  NO_DISPONIBLE: 'No disponible',
  APROBADO: 'Aprobado',
  PENDIENTE: 'Pendiente',
  CANCELADO: 'Cancelado',
  RECHAZADO: 'Rechazado',
  ENTREGADO: 'Entregado',
  DANADO: 'Dañado',
};

export type StatusBadgeProps = {
  status: string;
  /** Texto a mostrar; por defecto deriva del status. */
  label?: string;
  /** Pill translúcido (default) o sólido con texto blanco. */
  solid?: boolean;
};

export function StatusBadge({ status, label, solid }: StatusBadgeProps) {
  const color = statusColor[status as StatusKey] ?? colors.mutedForeground;
  const text = label ?? LABELS[status] ?? status;

  if (solid) {
    return (
      <View style={[styles.pill, { backgroundColor: color }]}>
        <Text style={[styles.text, { color: '#FFFFFF' }]}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.pill, { backgroundColor: withAlpha(color, 0.14) }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
  },
}));

export { withAlpha };
